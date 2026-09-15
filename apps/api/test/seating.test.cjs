const { test, after } = require('node:test');
const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const { PrismaClient } = require('@prisma/client');
const { EventsService } = require('../dist/events/events.service');
const { TicketsService } = require('../dist/tickets/tickets.service');
const { validateBooking, seatLabels } = require('../dist/common/booking');
const prisma = new PrismaClient();
const events = new EventsService(prisma);
const tickets = new TicketsService(prisma, events);
after(() => prisma.$disconnect());
const booking = {kind:'bus',destination:'Jinja',service:'Coach 1',seating:{rows:3,columns:4,aisleAfter:2,blocked:['12']}};
async function setup() {
 const owner = await prisma.user.create({data:{id:randomUUID(),name:'Host',email:`${randomUUID()}@example.com`,passwordHash:'test'}});
 const event = await events.create({name:'Journey',description:'Test',venue:'Kampala',startsAt:new Date('2030-01-01'),priceCents:1000,booking,ticketTypes:[{name:'Adult',priceCents:1000},{name:'Child',priceCents:500}]},owner);
 return {event,owner,types:(await events.findOne(event.id)).ticketTypes};
}
const buy = (eventId,ticketTypeId,seatLabels,quantity=seatLabels.length) => tickets.create({eventId,ticketTypeId,seatLabels,quantity,buyerName:'Passenger',buyerEmail:`${randomUUID()}@example.com`});
test('seat layouts validate bounds, blocked labels and formats', () => {
 assert.equal(seatLabels(validateBooking(booking)).length,11);
 assert.throws(()=>validateBooking({...booking,seating:{...booking.seating,rows:100}}));
 assert.throws(()=>validateBooking({...booking,seating:{...booking.seating,blocked:['99']}}));
 assert.deepEqual(seatLabels({kind:'cinema',seating:{rows:1,columns:3,aisleAfter:1,blocked:[]}}),['A1','A2','A3']);
});
test('concurrent buyers cannot issue the same seat, cancellation releases it, details and scans retain it', async()=>{
 const {event,owner,types}=await setup();
 assert.equal(event.capacity,11);
 const results=await Promise.allSettled(Array.from({length:5},()=>buy(event.id,types[0].id,['1'])));
 assert.equal(results.filter(r=>r.status==='fulfilled').length,1);
 const ticket=results.find(r=>r.status==='fulfilled').value[0];
 assert.equal(ticket.seatLabel,'1');
 assert.deepEqual((await events.findOne(event.id)).occupiedSeats,['1']);
 assert.equal((await tickets.scan(ticket.code,owner)).ticket.seatLabel,'1');
 await assert.rejects(events.update(event.id,{booking:{...booking,seating:{...booking.seating,rows:4}}},owner),/cannot change/);
 await prisma.ticket.update({where:{id:ticket.id},data:{status:'cancelled'}});
 assert.equal((await buy(event.id,types[1].id,['1']))[0].seatLabel,'1');
});
test('seat selections enforce quantity, uniqueness and blocked inventory; duplicates start empty',async()=>{
 const {event,owner,types}=await setup();
 await assert.rejects(buy(event.id,types[0].id,['12']));
 await assert.rejects(buy(event.id,types[0].id,['1','1']));
 await assert.rejects(buy(event.id,types[0].id,[],1));
 await assert.rejects(buy(event.id,types[0].id,['1'],2));
 const copy=await events.duplicate(event.id,new Date('2031-01-01'),owner);
 assert.deepEqual(copy.booking,booking);
 assert.equal(copy.ticketTypes.length,2);
 assert.deepEqual(copy.occupiedSeats,[]);
});

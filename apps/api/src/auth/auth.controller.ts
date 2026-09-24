import {
  Body,
  Controller,
  Get,
  Header,
  HttpCode,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
} from "@nestjs/common";
import { Response } from "express";
import { AuthGuard } from "./auth.guard";
import { AuthService, GOOGLE_OAUTH_STATE_COOKIE } from "./auth.service";
import { AuthenticatedRequest } from "./auth.types";
import { LoginDto } from "./dto/login.dto";
import { RegisterDto } from "./dto/register.dto";

@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post("register")
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post("login")
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Get("demo")
  @Header("Cache-Control", "no-store")
  demoAvailability() {
    return this.authService.demoAvailability();
  }

  @Post("demo")
  @HttpCode(200)
  @Header("Cache-Control", "no-store")
  loginToDemo() {
    return this.authService.loginToDemo();
  }

  @Get("google")
  google(@Query("next") next: string | undefined, @Res() response: Response) {
    const authorization = this.authService.googleAuthorization(next);
    response.cookie(
      GOOGLE_OAUTH_STATE_COOKIE,
      authorization.state,
      this.authService.googleStateCookie(),
    );
    response.redirect(authorization.url);
  }

  @Get("google/callback")
  async googleCallback(
    @Query("code") code: string | undefined,
    @Query("state") state: string | undefined,
    @Query("error") error: string | undefined,
    @Req() request: AuthenticatedRequest,
    @Res() response: Response,
  ) {
    response.clearCookie(GOOGLE_OAUTH_STATE_COOKIE, { path: "/" });
    if (error) {
      response.redirect(
        this.authService.googleFailureUrl("Google sign-in was cancelled."),
      );
      return;
    }

    if (!code || !state) {
      response.redirect(
        this.authService.googleFailureUrl("Google sign-in did not complete."),
      );
      return;
    }

    if (
      state !== readCookie(request.headers.cookie, GOOGLE_OAUTH_STATE_COOKIE)
    ) {
      response.redirect(
        this.authService.googleFailureUrl(
          "Google sign-in state did not match.",
        ),
      );
      return;
    }

    try {
      const session = await this.authService.loginWithGoogleCode(code, state);
      response.redirect(
        this.authService.googleCallbackUrl(session.token, session.next),
      );
    } catch (caught) {
      const message =
        caught instanceof Error ? caught.message : "Google sign-in failed.";
      response.redirect(this.authService.googleFailureUrl(message));
    }
  }

  @Get("me")
  @UseGuards(AuthGuard)
  me(@Req() request: AuthenticatedRequest) {
    return request.user;
  }
}

function readCookie(header: string | undefined, name: string) {
  return header
    ?.split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${name}=`))
    ?.slice(name.length + 1);
}

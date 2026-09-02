import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AdminGuard } from '../../common/guards/admin.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { User } from '../users/user.entity';
import { toUserView } from '../users/user-view';
import { UsersService } from '../users/users.service';
import { LoginEventsService } from '../login-events/login-events.service';
import { AlertsService } from '../alerts/alerts.service';
import { CareService } from '../care/care.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@UseGuards(AdminGuard)
@Controller('admin')
export class AdminController {
  constructor(
    private readonly users: UsersService,
    private readonly alerts: AlertsService,
    private readonly loginEvents: LoginEventsService,
    private readonly care: CareService,
  ) {}

  // ── Statistiques ────────────────────────────────────────────────
  @Get('stats')
  stats() {
    return this.users.stats();
  }

  @Get('stats/logins')
  loginsPerDay(@Query('days') days?: string) {
    const n = Math.min(90, Math.max(1, Number(days) || 14));
    return this.loginEvents.perDay(n);
  }

  // ── Alertes ─────────────────────────────────────────────────────
  @Get('alerts')
  listAlerts(@Query('all') all?: string) {
    return this.alerts.list(all === '1' || all === 'true');
  }

  @Get('alerts/unread-count')
  async unreadCount() {
    return { count: await this.alerts.unreadCount() };
  }

  @Patch('alerts/:id/read')
  async readAlert(@Param('id', ParseUUIDPipe) id: string) {
    await this.alerts.markRead(id);
    return { ok: true };
  }

  @Post('alerts/read-all')
  async readAllAlerts() {
    await this.alerts.markAllRead();
    return { ok: true };
  }

  // ── Comptes ─────────────────────────────────────────────────────
  @Get('users')
  async list() {
    return (await this.users.list()).map(toUserView);
  }

  @Post('users')
  async create(@Body() dto: CreateUserDto) {
    return toUserView(await this.users.create(dto));
  }

  @Patch('users/:id')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateUserDto,
    @CurrentUser() me: User,
  ) {
    return toUserView(await this.users.update(id, dto, me.id));
  }

  @Get('users/:id')
  async getOne(@Param('id', ParseUUIDPipe) id: string) {
    return toUserView(await this.users.getByIdOrThrow(id));
  }

  @Post('users/:id/regenerate-code')
  async regenerateCode(@Param('id', ParseUUIDPipe) id: string) {
    return toUserView(await this.users.regenerateLoginCode(id));
  }

  // ── Suivi santé d'une personne ─────────────────────────────────
  // Les contacts perso de la personne ne sont volontairement PAS exposés ici.
  @Get('users/:id/medications')
  medicationsOf(@Param('id', ParseUUIDPipe) id: string) {
    return this.care.listMedications(id);
  }

  @Get('users/:id/appointments')
  appointmentsOf(@Param('id', ParseUUIDPipe) id: string) {
    return this.care.listAppointments(id);
  }

  @Get('users/:id/medication-events')
  medicationEventsOf(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('limit') limit?: string,
  ) {
    return this.care.listMedicationEvents(
      id,
      Math.min(200, Math.max(1, Number(limit) || 50)),
    );
  }

  @Delete('users/:id')
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() me: User,
  ) {
    await this.users.remove(id, me.id);
    return { deleted: true };
  }
}

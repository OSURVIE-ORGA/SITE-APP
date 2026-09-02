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
import { toUserView } from '../users/user-view';
import { UsersService } from '../users/users.service';
import { AlertsService } from './alerts.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@UseGuards(AdminGuard)
@Controller('admin')
export class AdminController {
  constructor(
    private readonly users: UsersService,
    private readonly alerts: AlertsService,
  ) {}

  // ── Statistiques ────────────────────────────────────────────────
  @Get('stats')
  stats() {
    return this.users.stats();
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
  ) {
    return toUserView(await this.users.update(id, dto));
  }

  @Post('users/:id/regenerate-code')
  async regenerateCode(@Param('id', ParseUUIDPipe) id: string) {
    return toUserView(await this.users.regenerateLoginCode(id));
  }

  @Delete('users/:id')
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    await this.users.remove(id);
    return { deleted: true };
  }
}

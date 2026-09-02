import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AdminGuard } from '../../common/guards/admin.guard';
import { toUserView } from '../users/user-view';
import { UsersService } from '../users/users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@UseGuards(AdminGuard)
@Controller('admin/users')
export class AdminController {
  constructor(private readonly users: UsersService) {}

  @Get()
  async list() {
    return (await this.users.list()).map(toUserView);
  }

  @Post()
  async create(@Body() dto: CreateUserDto) {
    return toUserView(await this.users.create(dto));
  }

  @Patch(':id')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateUserDto,
  ) {
    return toUserView(await this.users.update(id, dto));
  }

  @Post(':id/regenerate-code')
  async regenerateCode(@Param('id', ParseUUIDPipe) id: string) {
    return toUserView(await this.users.regenerateLoginCode(id));
  }

  @Delete(':id')
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    await this.users.remove(id);
    return { deleted: true };
  }
}

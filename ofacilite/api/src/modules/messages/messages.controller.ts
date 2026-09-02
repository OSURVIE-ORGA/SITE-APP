import { Body, Controller, Get, Post } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { User } from '../users/user.entity';
import { SendMessageDto } from './dto/send-message.dto';
import { MessagesService } from './messages.service';

/** Fil de discussion de la personne connectée avec les administrateurs. */
@Controller('me/messages')
export class MessagesController {
  constructor(private readonly messages: MessagesService) {}

  @Get('unread-count')
  async unreadCount(@CurrentUser() me: User) {
    return { count: await this.messages.unreadForUser(me.id) };
  }

  @Get()
  list(@CurrentUser() me: User) {
    return this.messages.listForUser(me.id);
  }

  @Post()
  send(@CurrentUser() me: User, @Body() dto: SendMessageDto) {
    return this.messages.sendFromUser(me.id, dto.body);
  }
}

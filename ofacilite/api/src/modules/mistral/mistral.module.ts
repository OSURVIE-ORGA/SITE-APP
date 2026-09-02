import { Module } from '@nestjs/common';
import { MistralService } from './mistral.service';
import { MistralController } from './mistral.controller';

@Module({
  imports: [],
  controllers: [MistralController],
  providers: [MistralService],
  exports: [MistralService],
})
export class MistralModule {}

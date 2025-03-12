import { Global, Module } from '@nestjs/common';
import { UtilsService } from './utils.service';
import { JwtModule } from '@nestjs/jwt';
@Global()
@Module({
  imports: [JwtModule.register({})],
  providers: [UtilsService],
  exports: [UtilsService],
})
export class UtilsModule {}

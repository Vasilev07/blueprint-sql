import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FriendController } from './friend.controller';
import { FriendService } from '../../services/friend.service';
import { FriendGateway } from '../../gateways/friend.gateway';
import { UserFriend } from '../../entities/friend.entity';

@Module({
    imports: [TypeOrmModule.forFeature([UserFriend])],
    controllers: [FriendController],
    providers: [FriendService, FriendGateway],
    exports: [FriendService]
})
export class FriendModule {}

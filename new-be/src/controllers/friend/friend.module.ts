import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FriendController } from './friend.controller';
import { FriendService } from '../../services/friend.service';
import { UserFriend } from '../../entities/friend.entity';

@Module({
    imports: [TypeOrmModule.forFeature([UserFriend])],
    controllers: [FriendController],
    providers: [FriendService],
    exports: [FriendService]
})
export class FriendModule {}

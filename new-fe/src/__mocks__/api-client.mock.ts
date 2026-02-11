import { Injectable, NgModule } from "@angular/core";
import { of } from "rxjs";

@Injectable({ providedIn: "root" })
export class UserService {
    getUser = jest.fn().mockReturnValue(of({}));
    getProfilePictureByUserId = jest.fn().mockReturnValue(of(new Blob()));
    getProfileViewStats = jest.fn().mockReturnValue(of({}));
}

@Injectable({ providedIn: "root" })
export class SuperLikeService {
    sendSuperLike = jest.fn().mockReturnValue(of({}));
}

@Injectable({ providedIn: "root" })
export class GiftService {
    sendGift = jest.fn().mockReturnValue(of({}));
}

@Injectable({ providedIn: "root" })
export class WalletService {
    getBalance = jest.fn().mockReturnValue(of({}));
}

@Injectable({ providedIn: "root" })
export class ProductService {
    getProducts = jest.fn().mockReturnValue(of([]));
}

@Injectable({ providedIn: "root" })
export class OrderService {
    getOrders = jest.fn().mockReturnValue(of([]));
}

@Injectable({ providedIn: "root" })
export class CategoryService {
    getCategories = jest.fn().mockReturnValue(of([]));
}

@Injectable({ providedIn: "root" })
export class MessagesService {
    getMessages = jest.fn().mockReturnValue(of([]));
}

@Injectable({ providedIn: "root" })
export class ForumRoomsService {
    getRooms = jest.fn().mockReturnValue(of([]));
}

@Injectable({ providedIn: "root" })
export class FriendsService {
    getFriends = jest.fn().mockReturnValue(of([]));
}

@Injectable({ providedIn: "root" })
export class StoriesService {
    getStories = jest.fn().mockReturnValue(of([]));
}

@Injectable({ providedIn: "root" })
export class ChatService {
    getConversations = jest.fn().mockReturnValue(of([]));
}

@Injectable({ providedIn: "root" })
export class ForumPostsService {
    getPosts = jest.fn().mockReturnValue(of([]));
}

@Injectable({ providedIn: "root" })
export class ForumCommentsService {
    getComments = jest.fn().mockReturnValue(of([]));
}

export class UserDTO {}
export class ChatMessageDTO {}
export class ForumPostDTO {}
export class ForumCommentDTO {}
export class ProductDTO {}
export class OrderDTO {}
export class OrderItemDTO {}
export class CategoryDTO {}
export class ProfileViewDTO {}
export class FriendDTO {}
export class MessageDTO {}
export class CreateMessageDTO {}
export class VerificationRequestDTO {}
export class ChatConversationDTO {}
export class CreateConversationDTO {}
export class StoryDTO {}
export class StoryUploadResponseDTO {}
export class GetProfileViewStats200Response {}

export class Configuration {
    constructor(_params?: any) {}
}

@NgModule()
export class ApiModule {
    static forRoot(_configFactory: any): any {
        return { ngModule: ApiModule, providers: [] };
    }
}

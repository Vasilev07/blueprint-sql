import { Component, Input, Output, EventEmitter } from '@angular/core';
import { MessageDTO } from 'src/typescript-api-client/src/model/models';

@Component({
  selector: 'app-message-list',
  templateUrl: './message-list.component.html',
  // styleUrls: ['./message-list.component.scss']
})
export class MessageListComponent {
  @Input() messages: MessageDTO[] = [];
  @Input() loading = false;
  @Output() messageSelect = new EventEmitter<MessageDTO>();
  @Output() messageArchive = new EventEmitter<MessageDTO>();
  @Output() messageDelete = new EventEmitter<MessageDTO>();

  onMessageSelect(message: MessageDTO): void {
    this.messageSelect.emit(message);
  }

  onArchive(message: MessageDTO): void {
    this.messageArchive.emit(message);
  }

  onDelete(message: MessageDTO): void {
    this.messageDelete.emit(message);
  }
}

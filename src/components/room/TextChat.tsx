
import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { formatDistanceToNow } from 'date-fns';
import { Send, Code as CodeIcon } from 'lucide-react';

interface Message {
  _id: string;
  sender: {
    _id: string;
    username: string;
    avatar?: string;
  };
  content: string;
  type: 'text' | 'code' | 'system';
  createdAt: string;
}

interface TextChatProps {
  roomId: string;
  messages: Message[];
  onSendMessage: (content: string, type: 'text' | 'code') => void;
  currentUser: any;
}

const TextChat: React.FC<TextChatProps> = ({ 
  roomId,
  messages,
  onSendMessage,
  currentUser
}) => {
  const [message, setMessage] = useState('');
  const [isCode, setIsCode] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  
  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current;
      scrollContainer.scrollTop = scrollContainer.scrollHeight;
    }
  }, [messages]);
  
  const handleSendMessage = () => {
    if (!message.trim()) return;
    
    onSendMessage(message, isCode ? 'code' : 'text');
    setMessage('');
    setIsCode(false);
  };
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };
  
  const formatTime = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch (error) {
      return 'just now';
    }
  };
  
  return (
    <div className="flex flex-col h-full">
      <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
        <div className="space-y-4">
          {messages.length === 0 ? (
            <div className="flex items-center justify-center h-full py-8">
              <div className="text-center text-muted-foreground">
                <p>No messages yet</p>
                <p className="text-sm">Start the conversation!</p>
              </div>
            </div>
          ) : (
            messages.map((msg) => {
              const isCurrentUser = msg.sender._id === currentUser?.id;
              
              return (
                <div 
                  key={msg._id} 
                  className={`flex gap-3 ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
                >
                  {!isCurrentUser && (
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={msg.sender.avatar} alt={msg.sender.username} />
                      <AvatarFallback>{msg.sender.username?.[0]?.toUpperCase() || '?'}</AvatarFallback>
                    </Avatar>
                  )}
                  
                  <div className={`max-w-[75%] ${isCurrentUser ? 'order-1' : 'order-2'}`}>
                    {!isCurrentUser && (
                      <div className="text-xs text-muted-foreground mb-1">
                        {msg.sender.username}
                      </div>
                    )}
                    
                    {msg.type === 'system' ? (
                      <div className="bg-muted py-1.5 px-3 rounded-md text-sm text-center text-muted-foreground">
                        {msg.content}
                      </div>
                    ) : msg.type === 'code' ? (
                      <pre className="bg-secondary text-secondary-foreground py-2 px-3 rounded-md text-sm overflow-x-auto whitespace-pre-wrap break-words">
                        <code>{msg.content}</code>
                      </pre>
                    ) : (
                      <div 
                        className={`py-2 px-3 rounded-md text-sm ${
                          isCurrentUser 
                            ? 'bg-primary text-primary-foreground' 
                            : 'bg-secondary/50 text-foreground'
                        }`}
                      >
                        {msg.content}
                      </div>
                    )}
                    
                    <div className="text-xs text-muted-foreground mt-1">
                      {formatTime(msg.createdAt)}
                    </div>
                  </div>
                  
                  {isCurrentUser && (
                    <Avatar className="h-8 w-8 order-2">
                      <AvatarImage src={currentUser?.avatar} alt={currentUser?.username} />
                      <AvatarFallback>{currentUser?.username?.[0]?.toUpperCase() || '?'}</AvatarFallback>
                    </Avatar>
                  )}
                </div>
              );
            })
          )}
        </div>
      </ScrollArea>
      
      <div className="p-3 border-t border-border">
        <div className="flex items-center gap-2">
          <Textarea
            placeholder="Type a message..."
            className="resize-none min-h-[80px]"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <div className="flex flex-col gap-2">
            <Button 
              size="icon" 
              variant={isCode ? "default" : "outline"} 
              onClick={() => setIsCode(!isCode)}
              className="rounded-full h-9 w-9"
              title={isCode ? "Switch to text mode" : "Switch to code mode"}
            >
              <CodeIcon className="h-4 w-4" />
            </Button>
            <Button 
              size="icon" 
              onClick={handleSendMessage} 
              className="rounded-full h-9 w-9"
              disabled={!message.trim()}
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TextChat;


import React, { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { useToast } from "@/hooks/use-toast";
import { Socket } from 'socket.io-client';
import { useAuth } from '@/context/AuthContext';

interface CodeEditorProps {
  initialCode: string;
  language: string;
  roomId: string;
  socket?: Socket | null;
}

const CodeEditor: React.FC<CodeEditorProps> = ({ initialCode, language, roomId, socket }) => {
  const [code, setCode] = useState(initialCode);
  const [collaborators, setCollaborators] = useState<any[]>([]);
  const [isSaved, setIsSaved] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [cursorPosition, setCursorPosition] = useState({ line: 0, ch: 0 });
  
  // Initialize code from initialCode prop
  useEffect(() => {
    if (initialCode && code !== initialCode) {
      setCode(initialCode);
      console.log("Code initialized from props:", initialCode);
    }
  }, [initialCode]);
  
  // Setup socket event listeners for code synchronization
  useEffect(() => {
    if (!socket) return;
    
    console.log("Setting up code editor socket listeners");
    
    // Listen for code updates from other users
    socket.on('codeUpdate', (data) => {
      console.log("Received code update from server:", data.code?.substring(0, 50) + "...");
      setCode(data.code);
      setIsSaved(true);
    });
    
    // Listen for cursor position updates
    socket.on('cursorUpdate', (data) => {
      if (data.userId !== user?.id) {
        const existingUser = collaborators.find(c => c.id === data.userId);
        if (existingUser) {
          setCollaborators(prev => 
            prev.map(c => c.id === data.userId ? { ...c, position: data.position } : c)
          );
        } else {
          // Add new collaborator if they don't exist
          const colors = ['bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-yellow-500', 'bg-red-500'];
          const colorIndex = collaborators.length % colors.length;
          
          setCollaborators(prev => [
            ...prev, 
            { 
              id: data.userId, 
              name: data.name || 'User', 
              position: data.position,
              color: colors[colorIndex]
            }
          ]);
        }
      }
    });
    
    // Listen for active users to update collaborators
    socket.on('activeUsers', (users) => {
      console.log("Active users in code editor:", users);
      if (Array.isArray(users)) {
        const colors = ['bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-yellow-500', 'bg-red-500'];
        
        const newCollaborators = users
          .filter(u => u.id !== user?.id) // Filter out current user
          .map((u, index) => {
            const colorIndex = index % colors.length;
            return {
              id: u.id,
              name: u.username || u.firstName || 'User',
              position: { line: 1, ch: 0 },
              color: colors[colorIndex]
            };
          });
        
        setCollaborators(newCollaborators);
      }
    });
    
    // Clean up listeners on unmount
    return () => {
      socket.off('codeUpdate');
      socket.off('cursorUpdate');
      socket.off('activeUsers');
    };
  }, [socket, user, collaborators]);
  
  // Send code updates to server when code changes
  useEffect(() => {
    if (!socket || code === initialCode) return;
    
    setIsSaved(false);
    
    const updateTimeout = setTimeout(() => {
      console.log("Sending code update to server");
      socket.emit('codeChange', {
        roomId,
        code,
        language
      });
      setIsSaved(true);
    }, 1000); // Debounce to avoid too many updates
    
    return () => clearTimeout(updateTimeout);
  }, [code, socket, roomId, language, initialCode]);
  
  // Track cursor position
  const handleSelectionChange = () => {
    if (!textareaRef.current || !socket || !user) return;
    
    const textarea = textareaRef.current;
    const lines = textarea.value.substring(0, textarea.selectionStart).split('\n');
    const line = lines.length;
    const ch = lines[lines.length - 1].length;
    
    if (cursorPosition.line !== line || cursorPosition.ch !== ch) {
      setCursorPosition({ line, ch });
      
      // Send cursor position to server
      socket.emit('cursorChange', {
        roomId,
        position: { line, ch },
        userId: user.id,
        name: user.username || 'User'
      });
    }
  };
  
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setCode(e.target.value);
    handleSelectionChange();
  };
  
  const getHighlightedCode = () => {
    let highlighted = code;
    
    if (language === 'javascript' || language === 'typescript') {
      highlighted = highlighted
        .replace(/(const|let|var|function|return|if|else|for|while|class|import|export|from|async|await)/g, '<span class="text-purple-400">$1</span>')
        .replace(/(["'`])(.*?)\1/g, '<span class="text-yellow-300">$1$2$1</span>')
        .replace(/(\/\/.*)/g, '<span class="text-gray-500">$1</span>')
        .replace(/\b(\d+)\b/g, '<span class="text-blue-300">$1</span>');
    }
    
    return highlighted;
  };
  
  return (
    <div className="h-full flex flex-col">
      <div className="bg-secondary/30 p-2 border-b border-border">
        <div className="flex justify-between items-center">
          <div className="flex space-x-1.5">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
          </div>
          <div className="flex items-center space-x-2">
            <div className="text-xs">
              {isSaved ? (
                <span className="text-green-500">All changes saved</span>
              ) : (
                <span className="text-yellow-500">Saving...</span>
              )}
            </div>
            <div className="flex space-x-1">
              {collaborators.map(user => (
                <div key={user.id} className={`w-6 h-6 rounded-full ${user.color} flex items-center justify-center text-white text-xs`} title={`${user.name} is online`}>
                  {user.name.charAt(0)}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      
      <div className="flex flex-col flex-1 overflow-hidden">
        <div className="flex-1 overflow-auto relative">
          <textarea
            ref={textareaRef}
            value={code}
            onChange={handleChange}
            onKeyUp={handleSelectionChange}
            onClick={handleSelectionChange}
            className={cn(
              "absolute inset-0 w-full h-full p-4 font-mono text-sm resize-none",
              "bg-background outline-none opacity-100 z-10",
              "border-0 focus:ring-0"
            )}
            placeholder="Start coding here..."
            spellCheck="false"
          />
          
          <pre className="w-full h-full p-4 font-mono text-sm pointer-events-none">
            <code dangerouslySetInnerHTML={{ __html: getHighlightedCode() }}></code>
          </pre>
          
          {collaborators.map(user => (
            <div 
              key={user.id}
              className={`absolute ${user.color} w-0.5 h-5 animate-pulse`}
              style={{
                top: `${user.position.line * 1.5}rem`,
                left: `${user.position.ch * 0.6 + 1}rem`,
              }}
            >
              <div className={`absolute -top-5 left-0 ${user.color} text-white text-xs px-1 py-0.5 rounded whitespace-nowrap`}>
                {user.name}
              </div>
            </div>
          ))}
        </div>
        
        <div className="bg-secondary/30 p-2 border-t border-border text-xs flex justify-between">
          <div className="flex space-x-4">
            <div>
              {language.charAt(0).toUpperCase() + language.slice(1)}
            </div>
            <div>
              Lines: {code.split('\n').length}
            </div>
          </div>
          <div className="flex items-center">
            <span className="mr-2">Room:</span>
            <span className="font-mono bg-secondary px-2 py-0.5 rounded">{roomId}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CodeEditor;

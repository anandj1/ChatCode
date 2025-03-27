import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Copy, Check, Mail, Share, Lock } from 'lucide-react';
import { buildApiUrl } from '@/api/config';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { getUserByEmail, sendEmail } from '@/lib/api';

interface ShareRoomDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  roomId: string;
  roomName: string;
  isPrivate: boolean;
  password?: string | null;
}

const ShareRoomDialog: React.FC<ShareRoomDialogProps> = ({
  open,
  onOpenChange,
  roomId,
  roomName,
  isPrivate,
  password
}) => {
  const [isCopied, setIsCopied] = useState(false);
  const [email, setEmail] = useState('');
  const [isSharing, setIsSharing] = useState(false);
  const [error, setError] = useState('');
  const { token } = useAuth();
  const { toast } = useToast();

  const roomLink = `${window.location.origin}/room/${roomId}`;
  const logoUrl = 'https://i.ibb.co/JwbcDDyZ/favicon.png';

  const copyRoomLink = () => {
    navigator.clipboard.writeText(roomLink);
    setIsCopied(true);
    
    toast({
      title: "Link copied",
      description: "Room link copied to clipboard",
      variant: "success",
    });
    
    setTimeout(() => {
      setIsCopied(false);
    }, 2000);
  };

  const shareViaEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!email.trim() || !email.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }
    
    setIsSharing(true);
    
    try {
      let userData = null;
      try {
        userData = await getUserByEmail(email, token);
      } catch (error) {
        console.error('Error checking user existence:', error);
        toast({
          title: "Error",
          description: "Failed to check if user exists. Please try again.",
          variant: "destructive",
        });
        return;
      }

      if (userData && userData.user) {
        // User exists - Share room with existing user
        try {
          const shareResponse = await fetch(buildApiUrl(`rooms/${roomId}/share`), {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              userIds: [userData.user.id]
            })
          });

          if (!shareResponse.ok) {
            throw new Error('Failed to share room');
          }

          // Send invitation email to existing user
          await sendEmail({
            to: email,
            subject: `You've been invited to join ${roomName} on ChatCode`,
            text: `You've been invited to join "${roomName}" on ChatCode. Access the room here: ${roomLink}${password ? ` (Password: ${password})` : ''}`,
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
                <div style="text-align: center; margin-bottom: 20px;">
                  <img src="https://i.ibb.co/JwbcDDyZ/favicon.png" alt="ChatCode Logo" style="width: 100px; height: 100px; border-radius: 50%; object-fit: cover" />
                </div>
                <h2 style="color: #4f46e5;">Room Invitation</h2>
                <p>You've been invited to join the ChatCode room: <strong>${roomName}</strong></p>
                <p>Click the button below to join:</p>
                <div style="text-align: center; margin: 25px 0;">
                  <a href="${roomLink}" style="background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">Join Room</a>
                </div>
                ${password ? `
                <div style="background-color: #f3f4f6; padding: 15px; border-radius: 5px; margin: 15px 0;">
                  <p style="margin: 0; font-weight: bold;">Room Password: <span style="font-family: monospace; background: #e0e0e0; padding: 2px 6px; border-radius: 3px;">${password}</span></p>
                </div>
                ` : ''}
              </div>
            `
          }, token);

          toast({
            title: "Room shared",
            description: `Room shared successfully with ${email}`,
            variant: "success",
          });
        } catch (error) {
          console.error('Error sharing room with existing user:', error);
          toast({
            title: "Error",
            description: "Failed to share room. Please try again.",
            variant: "destructive",
          });
          return;
        }
      } else {
        // User doesn't exist - send registration invitation
        try {
          await sendEmail({
            to: email,
            subject: `Join ChatCode to access ${roomName}`,
            text: `You've been invited to join "${roomName}" on ChatCode. Create an account to get started: ${window.location.origin}/register?email=${encodeURIComponent(email)}`,
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
                <div style="text-align: center; margin-bottom: 20px;">
                  <img src="https://i.ibb.co/JwbcDDyZ/favicon.png" alt="ChatCode Logo" style="width: 100px; height: 100px; border-radius: 50%; object-fit: cover" />
                </div>
                <h2 style="color: #4f46e5;">Join ChatCode!</h2>
                <p>You've been invited to join the room: <strong>${roomName}</strong></p>
                <p>To get started, you'll need to create a ChatCode account:</p>
                <div style="text-align: center; margin: 25px 0;">
                  <a href="${window.location.origin}/register?email=${encodeURIComponent(email)}" style="background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">Create Account</a>
                </div>
                <p>After creating your account, you'll be able to access the room here: ${roomLink}</p>
                ${password ? `
                <div style="background-color: #f3f4f6; padding: 15px; border-radius: 5px; margin: 15px 0;">
                  <p style="margin: 0; font-weight: bold;">Room Password: <span style="font-family: monospace; background: #e0e0e0; padding: 2px 6px; border-radius: 3px;">${password}</span></p>
                </div>
                ` : ''}
              </div>
            `
          }, token);

          toast({
            title: "Invitation sent",
            description: `Since the specified gmail is not a member of our platform, an invitation to join ChatCode has been sent to ${email}`,
            variant: "success",
          });
        } catch (error) {
          console.error('Error sending registration invitation:', error);
          toast({
            title: "Error",
            description: "Failed to send invitation. Please try again.",
            variant: "destructive",
          });
          return;
        }
      }

      setEmail('');
    } catch (error) {
      console.error('Error in share process:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
      setError(error instanceof Error ? error.message : 'Failed to share room. Please try again.');
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share className="h-5 w-5" />
            Share Room
          </DialogTitle>
          <DialogDescription>
            Share this room with others to collaborate on code together.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="room-link">Room Link</Label>
            <div className="flex items-center gap-2">
              <Input 
                id="room-link"
                readOnly
                value={roomLink}
                onClick={(e) => e.currentTarget.select()}
              />
              <Button
                size="sm"
                onClick={copyRoomLink}
                variant="outline"
              >
                {isCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          </div>
          
          {isPrivate && password && (
            <div className="space-y-2">
              <Label className="flex items-center gap-2" htmlFor="room-password">
                <Lock className="h-4 w-4" />
                Room Password
              </Label>
              <div className="bg-primary/10 text-primary text-sm p-3 rounded border border-primary/20">
                <p className="font-medium">{password}</p>
                <p className="text-xs mt-1 text-muted-foreground">
                  Share this password with people you want to invite.
                </p>
              </div>
            </div>
          )}
          
          <div className="border-t pt-4">
            <form onSubmit={shareViaEmail} className="space-y-3">
              <Label htmlFor="email">Share with a user by email</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="email"
                  type="email"
                  placeholder="user@example.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (error) setError('');
                  }}
                  className={error ? 'border-destructive' : ''}
                />
                <Button 
                  type="submit" 
                  disabled={isSharing || !email.trim()}
                  size="sm"
                >
                  {isSharing ? (
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-background border-r-transparent"></span>
                  ) : (
                    <Mail className="h-4 w-4" />
                  )}
                </Button>
              </div>
              {error && <p className="text-xs text-destructive">{error}</p>}
            </form>
          </div>
        </div>
        
        <DialogFooter className="sm:justify-start">
          <div className="w-full text-center text-xs text-muted-foreground">
            When sharing with unregistered users, make sure to share the password separately for security reasons.
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ShareRoomDialog;
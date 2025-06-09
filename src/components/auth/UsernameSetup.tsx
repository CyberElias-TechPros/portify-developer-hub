
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useUsername } from '@/hooks/useUsername';
import { useToast } from '@/hooks/use-toast';
import { Check, X } from 'lucide-react';

interface UsernameSetupProps {
  onComplete?: () => void;
}

export default function UsernameSetup({ onComplete }: UsernameSetupProps) {
  const { username, createUsername, updateUsername, checkUsernameAvailable } = useUsername();
  const { toast } = useToast();
  const [newUsername, setNewUsername] = useState(username || '');
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
  const [checking, setChecking] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const validateUsername = (value: string) => {
    const regex = /^[a-zA-Z0-9_-]{3,30}$/;
    return regex.test(value);
  };

  const handleUsernameChange = async (value: string) => {
    setNewUsername(value);
    setIsAvailable(null);

    if (!value || !validateUsername(value)) {
      return;
    }

    if (value === username) {
      setIsAvailable(true);
      return;
    }

    setChecking(true);
    try {
      const available = await checkUsernameAvailable(value);
      setIsAvailable(available);
    } catch (error) {
      console.error('Error checking username:', error);
    } finally {
      setChecking(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newUsername || !validateUsername(newUsername)) {
      toast({
        title: 'Invalid username',
        description: 'Username must be 3-30 characters and contain only letters, numbers, hyphens, and underscores.',
        variant: 'destructive'
      });
      return;
    }

    if (isAvailable === false) {
      toast({
        title: 'Username taken',
        description: 'This username is already taken. Please choose another.',
        variant: 'destructive'
      });
      return;
    }

    setSubmitting(true);
    try {
      if (username) {
        await updateUsername(newUsername);
      } else {
        await createUsername(newUsername);
      }

      toast({
        title: 'Username saved',
        description: 'Your username has been set successfully.'
      });

      onComplete?.();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to save username.',
        variant: 'destructive'
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>
          {username ? 'Update Username' : 'Choose Your Username'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <div className="relative">
              <Input
                id="username"
                value={newUsername}
                onChange={(e) => handleUsernameChange(e.target.value)}
                placeholder="your-username"
                className="pr-10"
              />
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                {checking ? (
                  <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                ) : isAvailable === true ? (
                  <Check className="w-4 h-4 text-green-500" />
                ) : isAvailable === false ? (
                  <X className="w-4 h-4 text-red-500" />
                ) : null}
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              3-30 characters. Letters, numbers, hyphens, and underscores only.
            </p>
            {isAvailable === false && (
              <p className="text-xs text-red-500">
                This username is already taken.
              </p>
            )}
            {newUsername && !validateUsername(newUsername) && (
              <p className="text-xs text-red-500">
                Invalid username format.
              </p>
            )}
          </div>
          
          <Button
            type="submit"
            disabled={
              submitting ||
              checking ||
              !newUsername ||
              !validateUsername(newUsername) ||
              isAvailable === false
            }
            className="w-full"
          >
            {submitting ? 'Saving...' : username ? 'Update Username' : 'Set Username'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

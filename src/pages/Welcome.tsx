// ============= Welcome Page =============
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { HandMetal, Sparkles, Heart } from 'lucide-react';

const Welcome = () => {
  const [name, setName] = useState('');
  const navigate = useNavigate();

  const handleStart = () => {
    if (name.trim()) {
      localStorage.setItem('sign-language-user-name', name.trim());
      navigate('/app');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-accent/5 p-4">
      <div className="w-full max-w-2xl space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-primary/60 shadow-lg shadow-primary/20 mb-4">
            <HandMetal className="w-10 h-10 text-primary-foreground" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
            Tamil Sign Bridge
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-xl mx-auto">
            Transform your gestures into voice. Breaking barriers, building connections.
          </p>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-4">
          {[
            { icon: HandMetal, title: 'Real-time Recognition', desc: 'Instant sign detection' },
            { icon: Sparkles, title: 'AI-Powered', desc: 'Advanced ML models' },
            { icon: Heart, title: 'Inclusive', desc: 'Built for everyone' },
          ].map((feature, i) => (
            <Card key={i} className="border-muted/50 bg-card/50 backdrop-blur">
              <CardContent className="pt-6 text-center space-y-2">
                <feature.icon className="w-8 h-8 mx-auto text-primary" />
                <h3 className="font-semibold">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Main Card */}
        <Card className="border-2 shadow-xl">
          <CardHeader className="text-center space-y-2">
            <CardTitle className="text-2xl">Let's Get Started</CardTitle>
            <CardDescription className="text-base">
              "Turning your disability into ability—let's communicate together."
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="name" className="text-sm font-medium">
                What's your name?
              </label>
              <Input
                id="name"
                type="text"
                placeholder="Enter your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && name.trim()) handleStart();
                }}
                className="h-12 text-lg"
                autoFocus
              />
            </div>
            <Button
              onClick={handleStart}
              disabled={!name.trim()}
              size="lg"
              className="w-full h-12 text-lg font-semibold shadow-lg hover:shadow-xl transition-all"
            >
              Get Started
            </Button>
          </CardContent>
        </Card>

        {/* Footer */}
        <p className="text-center text-sm text-muted-foreground">
          Built with ❤️ for the Tamil community
        </p>
      </div>
    </div>
  );
};

export default Welcome;

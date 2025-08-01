"use client";

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Play, Square, Repeat, Trophy } from 'lucide-react';
import * as Tone from 'tone';

export default function RoundCounterPage() {
  const [totalRounds, setTotalRounds] = useState(0);
  const [desiredRounds, setDesiredRounds] = useState('10');
  const [isCounting, setIsCounting] = useState(false);
  const synth = useRef<Tone.Synth | null>(null);
  
  const numericDesiredRounds = parseInt(desiredRounds, 10) || 0;
  const hasReachedGoal = totalRounds > 0 && totalRounds >= numericDesiredRounds;

  useEffect(() => {
    // Initialize the synthesizer once on the client-side
    if (!synth.current) {
      synth.current = new Tone.Synth().toDestination();
    }
  }, []);

  useEffect(() => {
    // This effect runs when a round is completed (totalRounds changes)
    if (totalRounds > 0 && totalRounds >= numericDesiredRounds) {
      // Play a sound when the goal is met or exceeded
      if (synth.current) {
          synth.current.triggerAttackRelease("C5", "8n", Tone.now());
      }
    }
  }, [totalRounds, numericDesiredRounds]);

  const handleStartStop = () => {
    if (isCounting) {
      // Stopping a round
      setTotalRounds(prev => prev + 1);
    }
    // Toggling the state, whether starting or stopping
    setIsCounting(prev => !prev);
  };

  const handleReset = () => {
    setTotalRounds(0);
    setIsCounting(false);
    setDesiredRounds('10');
  };

  const handleDesiredRoundsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDesiredRounds(e.target.value);
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background p-4 font-body">
      <Card className="w-full max-w-md shadow-2xl bg-card border-2">
        <CardHeader className="text-center">
          <CardTitle className="text-4xl font-headline text-primary">
            Round Counter
          </CardTitle>
          <CardDescription className="text-base pt-1">
            Click Start, perform your activity, then click Stop to log a round.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-8 py-8">
          <div className="text-center">
            <Label className="text-lg text-muted-foreground">
              Total Rounds
            </Label>
            <p className="text-8xl font-bold text-primary tabular-nums">
              {totalRounds}
            </p>
          </div>

          <div className="w-full max-w-xs space-y-2">
            <Label htmlFor="desired-rounds" className="font-medium text-center block">
              Set Goal (Rounds)
            </Label>
            <Input
              id="desired-rounds"
              type="number"
              value={desiredRounds}
              onChange={handleDesiredRoundsChange}
              placeholder="e.g. 10"
              className="text-center text-lg h-12"
              min="1"
            />
          </div>

          {hasReachedGoal && !isCounting && (
            <div className="flex animate-in fade-in-50 items-center gap-3 rounded-lg border-2 border-accent bg-accent/10 p-4 text-accent">
              <Trophy className="h-8 w-8" />
              <div className="flex flex-col">
                <p className="font-bold text-lg">Goal Reached!</p>
                <p className="text-sm">Great work! You can reset to start a new session.</p>
              </div>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex flex-col sm:flex-row justify-center gap-4 pt-4">
          <Button
            onClick={handleStartStop}
            className="w-full sm:w-48 transition-colors duration-300"
            size="lg"
            disabled={hasReachedGoal && !isCounting}
            variant={isCounting ? "destructive" : "default"}
          >
            {isCounting ? (
              <><Square className="mr-2 h-5 w-5" /> Stop Round</>
            ) : (
              <><Play className="mr-2 h-5 w-5" /> Start Round</>
            )}
          </Button>
          <Button onClick={handleReset} variant="outline" size="lg" className="w-full sm:w-48">
            <Repeat className="mr-2 h-5 w-5" /> Reset
          </Button>
        </CardFooter>
      </Card>
    </main>
  );
}

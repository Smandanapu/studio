"use client";

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
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
import { Play, Repeat, Trophy, Timer, Hourglass, Users } from 'lucide-react';

const FAKE_COUNTER_STORAGE_KEY = 'hanumanVisitorCount_v2'; // Changed key to reset stored value
const INITIAL_COUNT = 100;
const MAX_COUNT = 1000000;

export default function RoundCounterPage() {
  const [totalRounds, setTotalRounds] = useState(0);
  const [desiredRounds, setDesiredRounds] = useState('10');
  const [isCounting, setIsCounting] = useState(false);
  const [isCalibrating, setIsCalibrating] = useState(false);
  const [calibrationStartTime, setCalibrationStartTime] = useState<number | null>(null);
  const [roundDuration, setRoundDuration] = useState<number | null>(null);
  const [visitorCount, setVisitorCount] = useState<number | null>(null);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const numericDesiredRounds = parseInt(desiredRounds, 10) || 0;
  const hasReachedGoal = totalRounds > 0 && totalRounds >= numericDesiredRounds;

  useEffect(() => {
    // This function now runs only on the client-side
    const getInitialVisitorCount = () => {
      try {
        const storedCount = localStorage.getItem(FAKE_COUNTER_STORAGE_KEY);
        if (storedCount) {
          const num = parseInt(storedCount, 10);
          // If stored value is invalid or past the max, reset to initial.
          if (isNaN(num) || num >= MAX_COUNT || num < INITIAL_COUNT) {
            localStorage.setItem(FAKE_COUNTER_STORAGE_KEY, String(INITIAL_COUNT));
            return INITIAL_COUNT;
          }
          return num;
        }
      } catch (error) {
        console.warn("Could not read from localStorage:", error);
      }
      // If nothing is stored, start with the initial count.
      localStorage.setItem(FAKE_COUNTER_STORAGE_KEY, String(INITIAL_COUNT));
      return INITIAL_COUNT;
    };

    setVisitorCount(getInitialVisitorCount());

    const counterInterval = setInterval(() => {
      setVisitorCount(prevCount => {
        if (prevCount === null) return INITIAL_COUNT;
        
        const newCount = prevCount + Math.floor(Math.random() * 3) + 1;
        
        if (newCount >= MAX_COUNT) {
           try {
            localStorage.setItem(FAKE_COUNTER_STORAGE_KEY, String(INITIAL_COUNT));
          } catch (error) {
            console.warn("Could not write to localStorage:", error);
          }
          return INITIAL_COUNT;
        }
        
        try {
          localStorage.setItem(FAKE_COUNTER_STORAGE_KEY, String(newCount));
        } catch (error) {
          console.warn("Could not write to localStorage:", error);
        }
        return newCount;
      });
    }, 5000); // Increment every 5 seconds

    return () => {
      clearInterval(counterInterval);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (isCounting && roundDuration) {
      intervalRef.current = setInterval(() => {
        setTotalRounds(prev => prev + 1);
      }, roundDuration);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isCounting, roundDuration]);
  
  useEffect(() => {
    if (hasReachedGoal) {
      setIsCounting(false);
      // Use browser's built-in speech synthesis
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        const utterance = new SpeechSynthesisUtterance('Jai hanuman your goal is reached');
        window.speechSynthesis.speak(utterance);
      }
    }
  }, [hasReachedGoal]);

  const handleCalibration = async () => {
    if (!isCalibrating) {
      // Start calibration
      // Unlock speech synthesis for mobile browsers by speaking a silent utterance on user gesture.
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        const silentUtterance = new SpeechSynthesisUtterance('');
        silentUtterance.volume = 0;
        window.speechSynthesis.speak(silentUtterance);
      }
      setIsCalibrating(true);
      setCalibrationStartTime(Date.now());
    } else {
      // Stop calibration
      if (calibrationStartTime) {
        const duration = Date.now() - calibrationStartTime;
        setRoundDuration(duration);
        setTotalRounds(1); // Count calibration as 1 round
      }
      setIsCalibrating(false);
      setCalibrationStartTime(null);
    }
  };

  const handleStart = () => {
    if (!isCounting) {
      setIsCounting(true);
    }
  };

  const handleReset = () => {
    setTotalRounds(0);
    setIsCounting(false);
    setIsCalibrating(false);
    setCalibrationStartTime(null);
    setRoundDuration(null);
    setDesiredRounds('10');
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
  };

  const handleDesiredRoundsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDesiredRounds(e.target.value);
  };

  const renderContent = () => {
    if (roundDuration === null) {
      return (
        <div className="text-center">
            <CardDescription className="text-base pt-1 mb-4">
              {isCalibrating
                ? 'Perform one round, then click Stop to set your pace.'
                : "First, let's time one Pradakhsna."}
            </CardDescription>
            <Button onClick={handleCalibration} size="lg" className="w-full sm:w-48">
              {isCalibrating ? (
                <><Hourglass className="mr-2 h-5 w-5 animate-spin" /> Stop Pradakhsnas</>
              ) : (
                <><Timer className="mr-2 h-5 w-5" /> Start Pradakhsnas</>
              )}
            </Button>
        </div>
      );
    }

    return (
       <>
        <div className="text-center">
          <Label className="text-lg text-muted-foreground">
            Rounds Finished
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
            disabled={isCounting}
          />
        </div>
        
        {roundDuration && (
            <p className="text-sm text-muted-foreground">
                Your devotional time for each round: {(roundDuration / 1000).toFixed(2)} seconds.
            </p>
        )}

        {hasReachedGoal && !isCounting && (
          <div className="flex animate-in fade-in-50 items-center gap-3 rounded-lg border-2 border-accent bg-accent/10 p-4 text-accent">
            <Trophy className="h-8 w-8" />
            <div className="flex flex-col text-center">
              <p className="font-semibold">Goal Reached!</p>
              <p className="text-sm">“Tvamasmin Kārya Niryoge Pramānam Hari Sattama Hanuman Yatna Māsthāya Dukha Kshaya Karo Bhava”</p>
            </div>
          </div>
        )}
      </>
    )
  }

  const renderFooter = () => {
      if (roundDuration === null) {
          return (
              <CardFooter className="flex flex-col sm:flex-row justify-center gap-4 pt-4">
                 <Button onClick={handleReset} variant="outline" size="lg" className="w-full sm:w-48">
                    <Repeat className="mr-2 h-5 w-5" /> Reset
                 </Button>
              </CardFooter>
          )
      }

      const isStartDisabled = isCounting || hasReachedGoal;

      return (
        <CardFooter className="flex flex-col sm:flex-row justify-center gap-4 pt-4">
          <Button
            onClick={handleStart}
            className="w-full sm:w-48 transition-colors duration-300"
            size="lg"
            disabled={isStartDisabled}
          >
            <Play className="mr-2 h-5 w-5" /> Start Counting
          </Button>
          <Button onClick={handleReset} variant="outline" size="lg" className="w-full sm:w-48">
            <Repeat className="mr-2 h-5 w-5" /> Reset
          </Button>
        </CardFooter>
      )
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background p-4 font-body">
      <Card className="w-full max-w-md shadow-2xl bg-card border-2">
        <CardHeader className="text-center items-center">
          <CardTitle className="text-4xl font-headline text-primary">
            "jAi  Hanuman" Round Counter
          </CardTitle>
          <Image
            src="https://upload.wikimedia.org/wikipedia/commons/thumb/c/c3/Hanuman_carrying_Dronagiri.jpg/800px-Hanuman_carrying_Dronagiri.jpg"
            alt="Lord Hanuman"
            width={192}
            height={192}
            className="rounded-md object-contain my-4"
            data-ai-hint="hanuman portrait"
          />
          {roundDuration && (
            <CardDescription className="text-base pt-1">
                The counter will advance automatically.
            </CardDescription>
          )}
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-8 py-8 min-h-[300px] justify-center">
          {renderContent()}
        </CardContent>
        {renderFooter()}
      </Card>
      <footer className="mt-8 text-center text-sm text-muted-foreground">
        Developed by: Sateesh Mandanapu
      </footer>
      {visitorCount !== null && (
        <div className="fixed bottom-4 right-4 flex items-center gap-2 rounded-full bg-card/80 backdrop-blur-sm p-2 pr-4 border shadow-lg">
          <Users className="h-5 w-5 text-primary" />
          <p className="text-sm font-medium text-primary">{visitorCount.toLocaleString()}</p>
        </div>
      )}
    </main>
  );
}

    
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
import { Play, Repeat, Trophy, Timer, Hourglass, Loader2 } from 'lucide-react';
import { textToSpeech } from '@/ai/flows/tts-flow';
import { useToast } from '@/hooks/use-toast';

export default function RoundCounterPage() {
  const [totalRounds, setTotalRounds] = useState(0);
  const [desiredRounds, setDesiredRounds] = useState('10');
  const [isCounting, setIsCounting] = useState(false);
  const [isCalibrating, setIsCalibrating] = useState(false);
  const [calibrationStartTime, setCalibrationStartTime] = useState<number | null>(null);
  const [roundDuration, setRoundDuration] = useState<number | null>(null);
  const [goalReachedAudio, setGoalReachedAudio] = useState<HTMLAudioElement | null>(null);
  const [isAudioLoading, setIsAudioLoading] = useState(true);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();

  const numericDesiredRounds = parseInt(desiredRounds, 10) || 0;
  const hasReachedGoal = totalRounds > 0 && totalRounds >= numericDesiredRounds;

  useEffect(() => {
    // Generate the audio once on initial load and store it in state.
    const getAudio = async () => {
      try {
        setIsAudioLoading(true);
        const response = await textToSpeech("JAI Hanuman");
        if (response.media) {
          const audio = new Audio(response.media);
          setGoalReachedAudio(audio);
        } else {
           throw new Error('Audio generation failed.');
        }
      } catch (error) {
        console.error("Failed to generate TTS audio:", error);
        toast({
          title: "Audio Error",
          description: "Could not load the goal notification sound. You may have exceeded the API quota.",
          variant: "destructive",
        });
      } finally {
        setIsAudioLoading(false);
      }
    };

    getAudio();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    return () => {
      // Cleanup interval on unmount
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
    if (hasReachedGoal && goalReachedAudio) {
      setIsCounting(false);
      
      let playCount = 0;
      const playAudio = () => {
        if (playCount < 3) {
          goalReachedAudio.currentTime = 0;
          goalReachedAudio.play().catch(e => console.error("Audio play failed", e));
          playCount++;
        } else {
          goalReachedAudio.removeEventListener('ended', playAudio);
        }
      };

      goalReachedAudio.addEventListener('ended', playAudio);
      playAudio(); // Start the first play
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasReachedGoal, goalReachedAudio]);

  const handleCalibration = () => {
    if (!isCalibrating) {
      // Start calibration
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
     if (isAudioLoading) {
      return (
        <div className="flex flex-col items-center justify-center text-center">
            <Loader2 className="mr-2 h-8 w-8 animate-spin" />
            <CardDescription className="text-base pt-4">
              Loading audio...
            </CardDescription>
        </div>
      );
    }

    if (roundDuration === null) {
      return (
        <div className="text-center">
            <CardDescription className="text-base pt-1 mb-4">
              {isCalibrating
                ? 'Perform one round, then click Stop to set your pace.'
                : "First, let's calibrate by timing one round."}
            </CardDescription>
            <Button onClick={handleCalibration} size="lg" className="w-full sm:w-48">
              {isCalibrating ? (
                <><Hourglass className="mr-2 h-5 w-5 animate-spin" /> Stop Calibration</>
              ) : (
                <><Timer className="mr-2 h-5 w-5" /> Start Calibration</>
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
                your devotional time for each round: {(roundDuration / 1000).toFixed(2)} seconds.
            </p>
        )}

        {hasReachedGoal && !isCounting && (
          <div className="flex animate-in fade-in-50 items-center gap-3 rounded-lg border-2 border-accent bg-accent/10 p-4 text-accent">
            <Trophy className="h-8 w-8" />
            <div className="flex flex-col text-center">
              <p className="text-sm">“Tvamasmin Kārya Niryoge Pramānam Hari Sattama Hanuman Yatna Māsthāya Dukha Kshaya Karo Bhava”</p>
              <p className="text-sm mt-2">“Tvamasmin Kārya Niryoge Pramānam Hari Sattama Rāghavastvatsamārambhāt Mayi Yatnaparo Bhavet”</p>
            </div>
          </div>
        )}
      </>
    )
  }

  const renderFooter = () => {
      if (roundDuration === null || isAudioLoading) {
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
        <CardHeader className="text-center">
          <CardTitle className="text-4xl font-headline text-primary">
            "jAI Hanuman" Round Counter
          </CardTitle>
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
    </main>
  );
}

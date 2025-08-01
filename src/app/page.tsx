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
import { Play, Repeat, Trophy, Timer, Hourglass } from 'lucide-react';
import { textToSpeech } from '@/ai/flows/tts-flow';


export default function RoundCounterPage() {
  const [totalRounds, setTotalRounds] = useState(0);
  const [desiredRounds, setDesiredRounds] = useState('10');
  const [isCounting, setIsCounting] = useState(false);
  const [isCalibrating, setIsCalibrating] = useState(false);
  const [calibrationStartTime, setCalibrationStartTime] = useState<number | null>(null);
  const [roundDuration, setRoundDuration] = useState<number | null>(null);
  const [goalReachedAudio, setGoalReachedAudio] = useState<HTMLAudioElement | null>(null);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const numericDesiredRounds = parseInt(desiredRounds, 10) || 0;
  const hasReachedGoal = totalRounds > 0 && totalRounds >= numericDesiredRounds;

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
    if (hasReachedGoal) {
      setIsCounting(false);
      
      const playAudioRepeatedly = (audio: HTMLAudioElement, times: number) => {
        if (times <= 0) return;
        
        let playedCount = 0;
        const playNext = () => {
            playedCount++;
            if (playedCount < times) {
                audio.currentTime = 0;
                audio.play().catch(e => {
                    console.error("Audio play failed", e);
                });
            }
        };

        audio.addEventListener('ended', playNext);
        audio.play().catch(e => {
            console.error("Audio play failed", e);
            audio.removeEventListener('ended', playNext);
        });
      };

      if (goalReachedAudio) {
        playAudioRepeatedly(goalReachedAudio, 3);
      } else {
        textToSpeech("JAI Hanuman").then(response => {
           if (response && response.media) {
             const audio = new Audio(response.media);
             setGoalReachedAudio(audio);
             playAudioRepeatedly(audio, 3);
           } else {
             console.error("Failed to generate audio or get media data.");
           }
        }).catch(error => {
          console.error("TTS flow failed:", error);
        });
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasReachedGoal]);

  const handleCalibration = () => {
    if (!isCalibrating) {
      // Start calibration
      setIsCalibrating(true);
      setCalibrationStartTime(Date.now());
    } else {
      // Stop calibration
      if (calibrationStartTime) {
        const duration = Date.now() - calibrationStartTime;
        setRoundDuration(duration + 10000);
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
      if (roundDuration === null) {
          return (
              <CardFooter className="flex flex-col sm:flex-row justify-center gap-4 pt-4">
                 <Button onClick={handleReset} variant="outline" size="lg" className="w-full sm:w-48">
                    <Repeat className="mr-2 h-5 w-5" /> Reset
                 </Button>
              </CardFooter>
          )
      }

      return (
        <CardFooter className="flex flex-col sm:flex-row justify-center gap-4 pt-4">
          <Button
            onClick={handleStart}
            className="w-full sm:w-48 transition-colors duration-300"
            size="lg"
            disabled={isCounting || hasReachedGoal}
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
    </main>
  );
}

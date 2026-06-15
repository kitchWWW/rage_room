// Prompts for each section of "Rage Room".
// Extracted from RR Prompts.rtf.

const PROMPTS = {
  1: [
    "What time did you wake up?",
    "What is the first thing you did when you opened your eyes?",
    "What is the first thing you tasted?",
    "How long did it take you to physically leave your bed?",
    "What is the first thing you did to get ready for the day?",
    "What was your plan for the day?",
    "Are you achieving what you set out to accomplish today?",
    "Did anyone or anything upset you today?",
    "Did you run into any roadblocks?",
    "Did you get any good news?",
    "Any bad news?",
    "Did you experience mild discomfort or anxiety?",
    "What caused it?",
    "Did you see or hear anything today that upset you?",
    "Is there anything that has upset you in the past that you thought of today?",
    "Is there anyone who upset you in the past that you thought of today?",
    "What was the situation?",
    "Were you angry?",
    "Were you sad?",
    "Were you anxious?",
    "Were you afraid?",
    "Did you fight back?",
    "If you didn't fight back, did you wish you did?",
    "Do you feel like you were wronged?",
    "Do you feel like you were vindicated?",
    "Do you take pride in another's downfall?",
    "What are you willing to destroy to make it to the top?"
  ],
  2: [
    "Have you ever made a mistake?",
    "Have you broken anything on accident?",
    "What was it?",
    "Have you broken anything on purpose?",
    "What was it?",
    "Have you broken something wooden?",
    "Have you broken something plastic?",
    "Have you broken something metal?",
    "Have you broken something using a tool?",
    "Have you broken something using equipment?",
    "Have you broken something using a household object?",
    "What was the biggest thing you've ever broken?",
    "What was the smallest thing you've ever broken?",
    "What was the weirdest thing you've ever broken?",
    "What is an item that you've broken the most through your life?",
    "Have you broken things that didn't belong to you?",
    "If it wasn't an accident, why did you break something?",
    "What is the point in breaking things?",
    "When something is broken, does it still have value?",
    "If something cannot be repaired, does it still have value?",
    "How do you destroy something so that it no longer has value?",
    "When you destroy something, is it for the purpose of erasure or for the purpose of catharsis?",
    "When have you destroyed something and NOT felt regret?",
    "Is destruction worth it?"
  ],
  3: [
    "How is your health?",
    "Do you exercise?",
    "How often do you get sick?",
    "How often are you in physical pain?",
    "Do your muscles ache from intentional use?",
    "Do your muscles ache regardless of how intensely you use them?",
    "Do you have issues with your internal organs?",
    "How often does your stomach hurt?",
    "Have you ever had difficulty breathing?",
    "How often would you say you end up bruising/cutting/scraping your skin?",
    "How many scars do you have?",
    "Have you been hospitalized?",
    "How many times have you been to the doctor?",
    "Have you donated blood?",
    "What is your blood type?",
    "Have you received blood?",
    "Have you ever had surgery?",
    "Have you ever broken a bone?",
    "Have you injured a part of yourself so badly that it will never be the same again?",
    "Have you had/had the possibility of needing to amputate an appendage?",
    "Have you considered plastic surgery, and if so, what part of your body?",
    "Have you mutilated parts of your body to relieve stress/gain control/etc.?",
    "Have you thought to mutilate parts of your body to relieve stress/gain control/etc.?",
    "Have you ever hurt someone else on accident?",
    "Have you ever hurt someone else on purpose?",
    "Is harm and violence ever justified?",
    "What would drive you or someone else to commit such acts?",
    "How can we save everyone?",
    "Can we save everyone?",
    "Who deserves to be saved?"
  ]
};

// Durations of the three fixed-media files in seconds (from afinfo).
// Used by the player page to time movement transitions independently of the admin.
const SECTION_DURATIONS = [127.198821, 157.141995, 161.631247];
const TOTAL_DURATION = SECTION_DURATIONS.reduce((a, b) => a + b, 0);

// White-overlay opacity targets per movement. The overlay starts at `start`
// when the movement begins and is stepped toward `end` on each Enter.
// Movement 0 = pre-start (fully opaque white, no noise visible).
const MOVEMENT_OPACITY = {
  0: { start: 1.0, end: 1.0 },
  1: { start: 0.9, end: 0.8 },
  2: { start: 0.7, end: 0.6 },
  3: { start: 0.5, end: 0.2 }
};

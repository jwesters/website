const drills = [
  {
    id: "form-shooting-wall",
    title: "Form Shooting Ladder",
    section: "Solo",
    skill: "Shooting",
    difficulty: "Beginner",
    players: "1",
    time: "8-12 min",
    equipment: "1 ball, hoop",
    diagram: "shootingSpots",
    summary: "Build clean shooting mechanics close to the basket before moving back.",
    setup: "Start 1-2 metres from the hoop. Use five close spots: front, left side, right side, left angle, right angle.",
    steps: [
      "Shoot 5 makes from the front using one-hand form if needed.",
      "Move to the next spot only after 5 clean makes.",
      "Focus on balance, eyes on target, elbow under ball, and a relaxed follow-through.",
      "Repeat the ladder from slightly farther back when all five spots are complete."
    ],
    coaching: ["Finish with fingers down into the hoop.", "Hold the follow-through until the ball hits the rim or net.", "Do not rush. Perfect reps matter more than speed."],
    progressions: ["Require swishes to count.", "Add a pass to yourself with backspin before each shot.", "Track total makes in 5 minutes."],
    example: "Example: Make 5 from the front, 5 from left block, 5 from right block, 5 from left angle, and 5 from right angle."
  },
  {
    id: "mikan",
    title: "Mikan Finishing",
    section: "Solo",
    skill: "Layups / Finishing",
    difficulty: "Beginner",
    players: "1",
    time: "5-8 min",
    equipment: "1 ball, hoop",
    diagram: "mikan",
    summary: "Practise soft touch and footwork directly around the rim.",
    setup: "Stand under the hoop with the ball. Start on one side of the rim.",
    steps: [
      "Make a right-hand layup off the backboard from the right side.",
      "Grab the ball out of the net or rebound it quickly.",
      "Step across and make a left-hand layup from the left side.",
      "Continue alternating sides for a set time or target number of makes."
    ],
    coaching: ["Use the hand closest to the sideline.", "Keep the ball high after each rebound.", "Aim softly at the top corner of the square."],
    progressions: ["Reverse Mikan using the outside side of the rim.", "No dribble between finishes.", "Set a goal of 20 makes in a row."],
    example: "Example: 30 seconds regular Mikan, 30 seconds reverse Mikan, rest, repeat 3 times."
  },
  {
    id: "cone-zigzag-dribble",
    title: "Cone Zigzag Handles",
    section: "Solo",
    skill: "Ball Handling",
    difficulty: "Beginner",
    players: "1",
    time: "8-10 min",
    equipment: "1 ball, 5-7 cones",
    diagram: "zigzag",
    summary: "Work on changing direction while protecting the ball.",
    setup: "Place cones in a zigzag from baseline to half court or across a safe open space.",
    steps: [
      "Dribble to the first cone with your outside hand.",
      "At the cone, make a crossover, retreat, between-the-legs, or behind-the-back move.",
      "Explode to the next cone for two hard dribbles.",
      "Turn around at the end and repeat back."
    ],
    coaching: ["Stay low with knees bent.", "Change speed after each move.", "Keep your off-hand up as a shield, not a push."],
    progressions: ["Weak hand only.", "Add a finish at the rim.", "Time each trip and try to beat it without losing control."],
    example: "Example: Round 1 crossovers, Round 2 between-the-legs, Round 3 behind-the-back, Round 4 player choice."
  },
  {
    id: "pound-series",
    title: "Pound Dribble Series",
    section: "Solo",
    skill: "Ball Handling",
    difficulty: "Beginner",
    players: "1",
    time: "6-8 min",
    equipment: "1 ball",
    diagram: "stationaryHandles",
    summary: "A stationary handle workout for stronger, cleaner dribbles.",
    setup: "Find a safe space. Stand in an athletic stance with the ball in one hand.",
    steps: [
      "Pound right hand for 30 seconds.",
      "Pound left hand for 30 seconds.",
      "Crossovers for 30 seconds.",
      "Between-the-legs for 30 seconds.",
      "Behind-the-back or wrap dribbles for 30 seconds."
    ],
    coaching: ["Push the ball hard into the floor.", "Keep eyes up as much as possible.", "Mistakes are fine; recover quickly."],
    progressions: ["Add a second ball.", "Use a tennis ball toss with the off-hand.", "Call out numbers on a wall while dribbling to keep eyes up."],
    example: "Example: 5 moves x 30 seconds, rest 45 seconds, repeat twice."
  },
  {
    id: "chair-pullups",
    title: "Chair Pull-Up Shooting",
    section: "Solo",
    skill: "Shooting",
    difficulty: "Intermediate",
    players: "1",
    time: "10-15 min",
    equipment: "1 ball, chair/cone, hoop",
    diagram: "pullup",
    summary: "Practise attacking a cone or chair and stopping under control for a jumper.",
    setup: "Place a chair or cone at the wing, top, or elbow. Start several steps away with the ball.",
    steps: [
      "Attack the chair with two or three hard dribbles.",
      "Make a quick move around it.",
      "Plant into a balanced 1-2 stop or jump stop.",
      "Shoot, rebound, and return to the start."
    ],
    coaching: ["Eyes rise before the shot.", "Stop on balance instead of drifting sideways.", "Land where you jumped from."],
    progressions: ["Add a pump fake before the shot.", "Use weak hand attack only.", "Make 3 in a row before changing spots."],
    example: "Example: 10 pull-ups from right wing, 10 from top, 10 from left wing."
  },
  {
    id: "free-throw-pressure",
    title: "Pressure Free Throws",
    section: "Solo",
    skill: "Shooting",
    difficulty: "Beginner",
    players: "1",
    time: "5-10 min",
    equipment: "1 ball, hoop",
    diagram: "freeThrow",
    summary: "Make free throws feel more game-like by attaching a small consequence or goal.",
    setup: "Stand at the free-throw line. Pick a target score before starting.",
    steps: [
      "Shoot two free throws like a game situation.",
      "Record makes and misses.",
      "If you miss both, complete a short reset task such as 5 defensive slides.",
      "Repeat until you reach your target."
    ],
    coaching: ["Use the same routine every time.", "Breathe before the shot.", "Think one simple cue, not five."],
    progressions: ["Must make 7 out of 10 to finish.", "Sprint to half court before each pair.", "End practice only after two makes in a row."],
    example: "Example: Goal is 8/10. If you miss two in a row, do 10 quick toe taps and restart the pair."
  },
  {
    id: "close-range-bank",
    title: "Bank Shot Squares",
    section: "Solo",
    skill: "Shooting",
    difficulty: "Beginner",
    players: "1",
    time: "6-10 min",
    equipment: "1 ball, hoop",
    diagram: "bankSpots",
    summary: "Learn the soft bank shot from angles near the hoop.",
    setup: "Start near the right block, then left block, then both short corners.",
    steps: [
      "Shoot a soft bank shot aiming for the upper outside corner of the square.",
      "Make 4 from one spot before moving.",
      "Use the same footwork each time.",
      "Complete all four spots."
    ],
    coaching: ["Soft touch beats power.", "Square shoulders to the backboard angle.", "Finish high."],
    progressions: ["Catch from a self-pass before each shot.", "Add one dribble into the bank shot.", "Weak hand bank shots close to rim."],
    example: "Example: 4 makes right block, 4 left block, 4 right short corner, 4 left short corner."
  },
  {
    id: "jab-go-finish",
    title: "Jab-Go Finish",
    section: "Solo",
    skill: "Layups / Finishing",
    difficulty: "Intermediate",
    players: "1",
    time: "8-12 min",
    equipment: "1 ball, hoop",
    diagram: "jabFinish",
    summary: "Practise ripping the ball through after a jab step and finishing strong.",
    setup: "Start on the wing facing the basket in triple-threat position.",
    steps: [
      "Jab step with your outside foot.",
      "Rip the ball low across your body.",
      "Take one hard dribble toward the basket.",
      "Finish with the correct hand off the backboard."
    ],
    coaching: ["Sell the jab with eyes and shoulders.", "Rip low and tight.", "First step should be explosive."],
    progressions: ["Add jab-shot fake-go.", "Add a cone defender.", "Alternate power layup and regular layup."],
    example: "Example: 8 finishes from right wing, 8 from left wing, then 8 with a shot fake first."
  },
  {
    id: "spin-finish",
    title: "Spin Move Finish",
    section: "Solo",
    skill: "Layups / Finishing",
    difficulty: "Advanced",
    players: "1",
    time: "8-10 min",
    equipment: "1 ball, cone, hoop",
    diagram: "spinFinish",
    summary: "Use a cone as a help defender and practise spinning into a controlled finish.",
    setup: "Place a cone near the lane line. Start on the wing or top with the ball.",
    steps: [
      "Attack the cone at game speed.",
      "Plant your inside foot beside the cone.",
      "Spin away from the cone while keeping the ball tight.",
      "Finish with two feet or an extended layup."
    ],
    coaching: ["Spin low, not upright.", "Keep the ball away from the imaginary defender.", "Find the rim quickly after the spin."],
    progressions: ["Add a second cone near the rim.", "Use weak-hand finishes.", "Add a reverse finish."],
    example: "Example: 5 right-hand spin finishes, 5 left-hand spin finishes, 5 reverse finishes each side."
  },
  {
    id: "floaters-lane",
    title: "Lane Floater Touch",
    section: "Solo",
    skill: "Layups / Finishing",
    difficulty: "Intermediate",
    players: "1",
    time: "8-10 min",
    equipment: "1 ball, hoop",
    diagram: "floater",
    summary: "Practise soft floaters over imaginary shot blockers in the lane.",
    setup: "Start at the elbow or wing. Use one or two dribbles into the paint.",
    steps: [
      "Attack into the lane under control.",
      "Pick the ball up before getting too deep under the rim.",
      "Release the floater high and soft.",
      "Rebound and repeat from the other side."
    ],
    coaching: ["High arc is the goal.", "Do not fade sideways.", "Use the backboard only when the angle makes sense."],
    progressions: ["Alternate one-foot and two-foot floaters.", "Add a cone as a help defender.", "Make 3 in a row from each side."],
    example: "Example: 10 floaters from right elbow, 10 from left elbow, then 10 from the middle."
  },
  {
    id: "wall-passing",
    title: "Wall Passing Targets",
    section: "Solo",
    skill: "Passing",
    difficulty: "Beginner",
    players: "1",
    time: "6-10 min",
    equipment: "1 ball, wall target/tape",
    diagram: "wallPass",
    summary: "Improve passing accuracy when no partner is available.",
    setup: "Put tape or a paper target on a safe wall. Stand 2-4 metres away.",
    steps: [
      "Make 25 chest passes to the target.",
      "Make 25 bounce passes that hit the floor once and reach the target.",
      "Make 15 overhead passes.",
      "Step back and repeat if accuracy is strong."
    ],
    coaching: ["Step toward the target.", "Thumbs finish down on chest passes.", "Aim small, miss small."],
    progressions: ["Add a dribble before passing.", "Use weak-hand push passes.", "Time 60 seconds and count accurate hits."],
    example: "Example: 20 chest, 20 bounce, 20 overhead, then 20 off-the-dribble passes."
  },
  {
    id: "defensive-slides",
    title: "Defensive Slide Box",
    section: "Solo",
    skill: "Defence",
    difficulty: "Beginner",
    players: "1",
    time: "5-8 min",
    equipment: "4 cones or floor markers",
    diagram: "slideBox",
    summary: "Build a low defensive stance and quick directional changes.",
    setup: "Set four cones in a square. Start at one corner in defensive stance.",
    steps: [
      "Slide to the next cone without crossing feet.",
      "Backpedal or drop step to the next cone.",
      "Slide across the baseline side.",
      "Sprint forward to the start and repeat."
    ],
    coaching: ["Chest up, hips low.", "Push from the outside foot.", "Hands active without reaching."],
    progressions: ["Coach or partner calls directions.", "Add a closeout at each cone.", "Go for 20 seconds on, 20 seconds off."],
    example: "Example: 4 trips clockwise, 4 trips counter-clockwise, then 4 trips with a closeout at every cone."
  },
  {
    id: "around-world-shooting",
    title: "Around the World Shooting",
    section: "Solo",
    skill: "Shooting",
    difficulty: "Intermediate",
    players: "1",
    time: "10-15 min",
    equipment: "1 ball, hoop",
    diagram: "aroundWorld",
    summary: "Use multiple marked spots to build shooting range and consistency.",
    setup: "Choose 7-9 shooting spots around the key and wings.",
    steps: [
      "Shoot from spot 1 until you make it.",
      "Move to the next spot after a make.",
      "If you miss twice in a row, move back one spot.",
      "Finish when you complete the full route."
    ],
    coaching: ["Keep the same shot pocket at every spot.", "Square up before the ball arrives if self-passing.", "Use your legs as you move farther out."],
    progressions: ["Must make two in a row per spot.", "Add one-dribble pull-ups.", "Time the full course."],
    example: "Example: Baseline, wing, elbow, free throw, opposite elbow, opposite wing, opposite baseline."
  },
  {
    id: "one-ball-two-spot",
    title: "Two-Spot Sprint Shooting",
    section: "Solo",
    skill: "Shooting",
    difficulty: "Advanced",
    players: "1",
    time: "8-12 min",
    equipment: "1 ball, hoop",
    diagram: "twoSpotSprint",
    summary: "Conditioning and shooting combined: sprint between two spots and shoot under fatigue.",
    setup: "Pick two shooting spots, such as both elbows or both wings.",
    steps: [
      "Start at spot A, self-pass, and shoot.",
      "Rebound quickly.",
      "Sprint/dribble to spot B and shoot.",
      "Continue for 60 seconds and count makes."
    ],
    coaching: ["Get feet set before shooting.", "Do not let tired legs change the release.", "Rebound with urgency."],
    progressions: ["Beat your make score each round.", "Use 90-second rounds.", "Only count makes that are balanced."],
    example: "Example: 60 seconds elbows, rest 60, 60 seconds wings, rest 60, repeat."
  },
  {
    id: "partner-pivot-pass",
    title: "Pivot and Pass",
    section: "Partner / Small Group",
    skill: "Passing",
    difficulty: "Beginner",
    players: "2-4",
    time: "8-10 min",
    equipment: "1 ball per pair",
    diagram: "partnerPass",
    summary: "Practise strong pivots, ball protection, and accurate passes.",
    setup: "Partners stand 3-5 metres apart. One player has the ball and pretends to be guarded.",
    steps: [
      "Player with the ball makes a front pivot, then passes.",
      "Receiver catches in triple-threat position.",
      "Receiver makes a reverse pivot, then passes back.",
      "Switch pivot types every minute."
    ],
    coaching: ["Chin the ball and keep elbows strong, but safe.", "Pivot on the ball of the foot.", "Show a target with hands."],
    progressions: ["Add a passive defender.", "Require bounce passes only.", "Move after every pass to a new angle."],
    example: "Example: 1 minute front pivot chest pass, 1 minute reverse pivot bounce pass, 1 minute overhead pass."
  },
  {
    id: "partner-closeout-drive",
    title: "Closeout, Contain, Drive",
    section: "Partner / Small Group",
    skill: "Defence",
    difficulty: "Intermediate",
    players: "2-3",
    time: "10-12 min",
    equipment: "1 ball, hoop",
    diagram: "closeout",
    summary: "A controlled 1-on-1 drill for closeouts and first-step attacks.",
    setup: "Offensive player starts on the wing. Defender starts near the key with the ball, passes out, then closes out.",
    steps: [
      "Defender passes to the offensive player.",
      "Defender sprints halfway, then chops feet with high hands.",
      "Offence gets two dribbles to score.",
      "Switch roles after each rep."
    ],
    coaching: ["Close out under control.", "Force the ball toward the help side or sideline.", "Offence should attack the defender's top foot."],
    progressions: ["Offence must shoot if defender is late.", "Add a third player as rebounder.", "Play best of 7 stops."],
    example: "Example: Right wing for 5 reps each, left wing for 5 reps each, then top of key for 5 reps each."
  },
  {
    id: "give-go",
    title: "Give-and-Go Finishing",
    section: "Partner / Small Group",
    skill: "Passing",
    difficulty: "Beginner",
    players: "2-4",
    time: "8-12 min",
    equipment: "1 ball, hoop",
    diagram: "giveGo",
    summary: "Practise passing, cutting, and finishing without standing still after a pass.",
    setup: "One player starts on the wing with the ball. Partner starts near the top or opposite wing.",
    steps: [
      "Wing passes to partner.",
      "Passer immediately cuts hard to the basket.",
      "Partner leads the cutter with a bounce pass or chest pass.",
      "Cutter finishes, rebounds, and players switch roles."
    ],
    coaching: ["Pass and move right away.", "Cut shoulder-to-shoulder past an imaginary defender.", "Lead the cutter, do not pass behind them."],
    progressions: ["Add a defender guarding the cutter.", "Finish with weak hand.", "Add a shot fake before the cut."],
    example: "Example: 10 makes from right wing cuts, 10 makes from left wing cuts."
  },
  {
    id: "partner-shooting-pass",
    title: "Catch-and-Shoot Partner Spots",
    section: "Partner / Small Group",
    skill: "Shooting",
    difficulty: "Beginner",
    players: "2-3",
    time: "10-15 min",
    equipment: "1-2 balls, hoop",
    diagram: "catchShoot",
    summary: "A simple partner drill for passing, shot prep, and rhythm shooting.",
    setup: "Shooter starts at a spot. Partner rebounds and passes back.",
    steps: [
      "Shooter shows hands and gets feet ready before the pass.",
      "Partner passes to the shooting pocket.",
      "Shooter catches, squares, and shoots.",
      "Switch after 10 shots or 5 makes."
    ],
    coaching: ["Feet should be ready before the catch.", "Passes should help the shooter, not make them reach.", "Call the shooter's name before passing."],
    progressions: ["Move to a new spot after 3 makes.", "Add one-dribble pull-ups.", "Make it competitive: first to 7 makes."],
    example: "Example: 5 spots, 10 shots at each spot, switch shooter after each spot."
  },
  {
    id: "two-ball-passing",
    title: "Two-Ball Partner Passing",
    section: "Partner / Small Group",
    skill: "Passing",
    difficulty: "Intermediate",
    players: "2",
    time: "6-8 min",
    equipment: "2 balls",
    diagram: "twoBallPass",
    summary: "Develop quick hands and communication by passing two balls at once.",
    setup: "Partners face each other 3-4 metres apart, each holding a ball.",
    steps: [
      "Player A chest passes while Player B bounce passes at the same time.",
      "Catch cleanly and repeat without pauses.",
      "Switch which player bounce passes after 30 seconds.",
      "Try overhead plus bounce pass for a harder round."
    ],
    coaching: ["Talk before switching pass types.", "Keep passes straight and safe.", "Catch with two hands before passing again."],
    progressions: ["Step back after 10 clean exchanges.", "Add lateral slides while passing.", "Use one-hand push passes."],
    example: "Example: 30 seconds chest/bounce, 30 seconds switch roles, 30 seconds overhead/bounce."
  },
  {
    id: "1v1-cone-gate",
    title: "1-on-1 Cone Gate",
    section: "Partner / Small Group",
    skill: "Ball Handling",
    difficulty: "Intermediate",
    players: "2-3",
    time: "10-15 min",
    equipment: "1 ball, 2 cones, hoop",
    diagram: "coneGate",
    summary: "Offence must attack through a gate before trying to score.",
    setup: "Set two cones as a gate on the wing or top. Defender starts between offence and basket.",
    steps: [
      "Offence starts outside the gate.",
      "On go, offence uses dribble moves to get through the gate.",
      "After crossing the gate, offence gets three dribbles to score.",
      "Defender tries to contain without fouling."
    ],
    coaching: ["Use change of pace, not just speed.", "Defender should slide first, reach last.", "Protect the ball through the gate."],
    progressions: ["Make the gate narrower.", "Weak-hand only through the gate.", "Winner stays on offence."],
    example: "Example: Play to 5 points. Offence gets 1 point for scoring, defender gets 1 point for a stop."
  },
  {
    id: "partner-rebounding",
    title: "Hit-Find-Get Rebounding",
    section: "Partner / Small Group",
    skill: "Rebounding",
    difficulty: "Beginner",
    players: "2-4",
    time: "8-10 min",
    equipment: "1 ball, hoop",
    diagram: "rebounding",
    summary: "Teach the simple rebounding sequence: make contact, locate the ball, go get it.",
    setup: "One player shoots or tosses the ball off the backboard. Defender starts in front of partner.",
    steps: [
      "On the shot, defender makes safe body contact with the offensive player.",
      "Defender turns to find the ball.",
      "Defender jumps or steps to secure the rebound with two hands.",
      "Outlet pass to partner and switch roles."
    ],
    coaching: ["Contact first, then locate the ball.", "Rebound with two hands.", "Protect the ball under the chin after securing it."],
    progressions: ["Offensive player tries to get around after contact.", "Add a second offensive rebounder.", "Score 1 point for each clean box-out rebound."],
    example: "Example: First to 7 rebounds wins. Switch sides and play again."
  },
  {
    id: "3-man-weave",
    title: "3-Man Weave",
    section: "Team",
    skill: "Passing",
    difficulty: "Intermediate",
    players: "3+",
    time: "8-12 min",
    equipment: "1 ball, full court",
    diagram: "weave",
    summary: "Classic full-court passing drill with movement, spacing, and layup finish.",
    setup: "Three lines on the baseline: left, middle, right. Middle line starts with the ball.",
    steps: [
      "Middle passes to one wing and runs behind that player.",
      "Receiver passes to the opposite player and runs behind them.",
      "Continue weaving down the court without dribbling.",
      "Finish with a layup, rebound, and rotate back."
    ],
    coaching: ["Pass in front of the runner.", "Run wide lanes.", "No travelling after catches."],
    progressions: ["Add a return trip with no dropped passes.", "Require weak-hand layups on one side.", "Add a defender chasing after the first pass."],
    example: "Example: Team goal is 12 made layups in 2 minutes with no missed rotations."
  },
  {
    id: "shell-defense",
    title: "4-on-4 Shell Defence",
    section: "Team",
    skill: "Defence",
    difficulty: "Intermediate",
    players: "8+",
    time: "12-20 min",
    equipment: "1 ball, half court",
    diagram: "shell",
    summary: "Teach help defence, ball pressure, denial, and rotations.",
    setup: "Four offensive players around the perimeter. Four defenders match up. Offence moves the ball but does not score at first.",
    steps: [
      "Defender on the ball pressures without reaching.",
      "One pass away defenders deny or are in the gap.",
      "Two passes away defenders help toward the lane.",
      "Coach calls drive, skip, or shot to trigger rotations."
    ],
    coaching: ["See ball and player.", "Move on the pass, not after the catch.", "Talk: ball, help, deny, cutter."],
    progressions: ["Allow controlled drives.", "Allow scoring after 4 passes.", "Add cutters and screens."],
    example: "Example: Defence must get 3 stops in a row to rotate off. Offence scores by paint touch or made shot."
  },
  {
    id: "transition-3v2-2v1",
    title: "3-on-2 to 2-on-1 Transition",
    section: "Team",
    skill: "Transition",
    difficulty: "Advanced",
    players: "7+",
    time: "12-18 min",
    equipment: "1 ball, full court",
    diagram: "transition",
    summary: "Practise fast-break decisions, spacing, and defensive disadvantage situations.",
    setup: "Three offensive players attack two defenders. After the shot or turnover, the two defenders attack back against one defender.",
    steps: [
      "Three attackers fill middle and wings going one direction.",
      "Two defenders protect the paint and stop the ball.",
      "After the possession ends, the two defenders become offence going back.",
      "The shooter or passer becomes the lone defender."
    ],
    coaching: ["Middle player forces a defender to commit.", "Wings run wide.", "Defenders communicate who has ball and who has basket."],
    progressions: ["Limit dribbles.", "Add a trailing defender.", "Score must come from layup or open catch-and-shoot."],
    example: "Example: Play continuous for 4 minutes. Track points for offence and stops for defence."
  },
  {
    id: "five-out-drive-kick",
    title: "5-Out Drive and Kick",
    section: "Team",
    skill: "Offence",
    difficulty: "Intermediate",
    players: "5+",
    time: "10-16 min",
    equipment: "1 ball, half court",
    diagram: "fiveOut",
    summary: "Build spacing habits: drive gaps, kick out, relocate, and make the next pass.",
    setup: "Five players spaced around the three-point line or outside the key for younger players.",
    steps: [
      "Player at top drives a gap for two dribbles.",
      "Help defender steps in or coach calls 'help'.",
      "Driver kicks to the open teammate.",
      "Passer relocates and the next player drives or swings."
    ],
    coaching: ["Stay spaced. Do not drift toward the ball.", "Receiver should be shot-ready.", "Drive to pass, not into a crowd."],
    progressions: ["Add live defence after 3 passes.", "Require paint touch before shot.", "Use a 0.5-second decision rule."],
    example: "Example: Ball must touch paint once and be kicked out before the team can shoot."
  },
  {
    id: "fast-break-lanes",
    title: "Fast-Break Lanes",
    section: "Team",
    skill: "Transition",
    difficulty: "Beginner",
    players: "5+",
    time: "8-12 min",
    equipment: "1 ball, full court",
    diagram: "lanes",
    summary: "Teach players to run wide, fill the middle, and finish in transition.",
    setup: "Three lines on the baseline. Middle line has the ball. Wings start wide near sidelines.",
    steps: [
      "Middle dribbles up the court.",
      "Wings sprint wide lanes, staying outside until the pass.",
      "Middle passes to a wing near the scoring area.",
      "Wing finishes layup while opposite wing rebounds."
    ],
    coaching: ["Run wide first, then cut in to score.", "Middle keeps head up.", "Pass before the lane gets crowded."],
    progressions: ["Add one retreating defender.", "Finish with weak hand on left side.", "No dribble after the pass."],
    example: "Example: Right wing layup down, left wing layup back. Team goal: 16 makes in 3 minutes."
  },
  {
    id: "numbered-break",
    title: "Numbered Fast Break",
    section: "Team",
    skill: "Decision Making",
    difficulty: "Intermediate",
    players: "6+",
    time: "10-15 min",
    equipment: "1 ball, full court",
    diagram: "numberedBreak",
    summary: "Players react to called numbers to create unpredictable advantage breaks.",
    setup: "Players line up on baseline. Coach assigns or calls numbers. Ball starts with coach or first player.",
    steps: [
      "Coach calls three offensive numbers and two defensive numbers.",
      "Called players sprint into play immediately.",
      "Offence attacks before defence gets set.",
      "Play until score, rebound, or turnover."
    ],
    coaching: ["React quickly to the call.", "Offence should spread the floor right away.", "Defence protects rim first."],
    progressions: ["Call 4-on-3 or 2-on-1.", "Add a trailer after two seconds.", "Award bonus for making the extra pass."],
    example: "Example: Coach calls '1, 4, 6 offence; 2, 5 defence' and players sprint into a 3-on-2."
  },
  {
    id: "screen-away",
    title: "Pass and Screen Away",
    section: "Team",
    skill: "Offence",
    difficulty: "Intermediate",
    players: "5+",
    time: "10-15 min",
    equipment: "1 ball, half court",
    diagram: "screenAway",
    summary: "Teach players not to stand after passing by screening away for a teammate.",
    setup: "Set up with players spaced around the perimeter. Ball starts on the wing or top.",
    steps: [
      "Player passes to a teammate.",
      "Passer goes away from the ball to set a screen.",
      "Teammate uses the screen to cut or pop.",
      "Ball handler looks to pass to the cutter, then the drill continues."
    ],
    coaching: ["Set screens with feet stopped and hands in.", "Cutter should brush shoulder-to-shoulder off the screen.", "Passer must read curl, pop, or back cut."],
    progressions: ["Add defence on cutters.", "Allow live scoring after a screen away.", "Require two screen actions before shooting."],
    example: "Example: Top passes wing, screens opposite wing, cutter curls to basket, wing passes for layup."
  },
  {
    id: "bump-cutter",
    title: "Bump the Cutter",
    section: "Team",
    skill: "Defence",
    difficulty: "Advanced",
    players: "6+",
    time: "10-15 min",
    equipment: "1 ball, half court",
    diagram: "bumpCutter",
    summary: "Help defenders learn how to safely slow cutters and recover.",
    setup: "Offensive players on wings and corners. Defenders match up. Ball starts on one wing.",
    steps: [
      "Weak-side offensive player cuts through the lane.",
      "Help defender steps into the cutter's path safely with body position.",
      "Defender communicates and recovers to their player.",
      "Ball is reversed and another cutter goes."
    ],
    coaching: ["Bump with body position, not hands.", "Keep eyes on ball and cutter.", "Recover quickly after the cutter clears."],
    progressions: ["Allow back cuts.", "Add live scoring after two cuts.", "Require defenders to call every cutter."],
    example: "Example: Offence gets a point for a clean layup cut; defence gets a point for denying the cut and recovering."
  },
  {
    id: "war-rebounding",
    title: "Rebounding War",
    section: "Team",
    skill: "Rebounding",
    difficulty: "Intermediate",
    players: "6+",
    time: "8-12 min",
    equipment: "1 ball, hoop",
    diagram: "war",
    summary: "Competitive rebounding with contact, positioning, and quick finishes.",
    setup: "Two or three players on offence, two or three on defence. Coach shoots or tosses the ball off the rim.",
    steps: [
      "On the shot, defenders box out.",
      "All players compete for the rebound.",
      "If offence rebounds, they try to score immediately.",
      "If defence rebounds, they outlet to coach and earn a stop."
    ],
    coaching: ["Find a body before finding the ball.", "Rebound outside your area.", "Go back up strong if you get an offensive board."],
    progressions: ["Play 3-on-3 live after every rebound.", "Defence must secure two rebounds in a row to rotate.", "Add free throws after fouls or poor contact."],
    example: "Example: First team to 5 rebounds wins. Offensive rebounds are worth 2 points."
  },
  {
    id: "shell-closeout-shoot",
    title: "Closeout to Box Out",
    section: "Team",
    skill: "Defence",
    difficulty: "Intermediate",
    players: "6+",
    time: "10-12 min",
    equipment: "1 ball, half court",
    diagram: "closeoutBox",
    summary: "Connect the end of a defensive possession: closeout, contest, box out, rebound.",
    setup: "Offensive players start on perimeter. Defenders start in help positions. Coach passes to a shooter.",
    steps: [
      "Coach passes to one offensive player.",
      "Nearest defender closes out under control.",
      "Shooter takes a shot or shot fake into one dribble.",
      "Defence contests, boxes out, and rebounds."
    ],
    coaching: ["High hand on the shot, low hips on the drive.", "Do not fly by the shooter.", "Finish the possession with a rebound."],
    progressions: ["Allow live play after the shot fake.", "Add skip passes.", "Defence stays on until three rebounds."],
    example: "Example: Defence earns 1 point for a stop, 2 points for a stop plus clean outlet."
  },
  {
    id: "layup-lines-pressure",
    title: "Pressure Layup Lines",
    section: "Team",
    skill: "Layups / Finishing",
    difficulty: "Beginner",
    players: "6+",
    time: "8-10 min",
    equipment: "2 balls, hoop",
    diagram: "layupLines",
    summary: "A classic layup-line structure with goals so it does not become lazy.",
    setup: "Two lines: shooting line on wing and rebounding line on opposite side. Ball starts in shooting line.",
    steps: [
      "Shooter dribbles in for a layup.",
      "Rebounder collects the ball before it bounces twice.",
      "Rebounder passes to the next shooter and joins shooting line.",
      "Shooter joins rebounding line."
    ],
    coaching: ["Correct footwork: outside foot, inside knee up.", "Use the backboard square.", "Rebounders should pass quickly and accurately."],
    progressions: ["Team must make 20 in 2 minutes.", "Weak-hand layups only.", "Add a coach with a pad or cone as light pressure."],
    example: "Example: 90 seconds right-hand layups, 90 seconds left-hand layups, 90 seconds reverse layups."
  },
  {
    id: "advantage-4v3",
    title: "4-on-3 Advantage Attack",
    section: "Team",
    skill: "Decision Making",
    difficulty: "Advanced",
    players: "7+",
    time: "10-15 min",
    equipment: "1 ball, half court",
    diagram: "advantage",
    summary: "Offence learns to find the open player while defence rotates outnumbered.",
    setup: "Four offensive players spaced around the arc. Three defenders start in the paint or gaps.",
    steps: [
      "Coach passes to offence to start.",
      "Offence attacks with quick passes, drives, and spacing.",
      "Defence rotates to stop ball and cover the next pass.",
      "Play until score, stop, or 8 seconds."
    ],
    coaching: ["Move the ball faster than the defence can rotate.", "Attack closeouts.", "Defence should rotate together and communicate."],
    progressions: ["Add a fourth defender after 3 seconds.", "Require a paint touch before a shot.", "Limit offence to one dribble per catch."],
    example: "Example: Offence gets 2 points for a layup, 1 for an open jumper. Defence gets 1 for any stop."
  },
  {
    id: "circle-passing",
    title: "Circle Passing Reaction",
    section: "Warm-Up / Conditioning",
    skill: "Passing",
    difficulty: "Beginner",
    players: "5+",
    time: "5-8 min",
    equipment: "1-2 balls",
    diagram: "circle",
    summary: "Quick warm-up that builds communication, hands, and awareness.",
    setup: "Players form a circle. One or two balls are used depending on group skill.",
    steps: [
      "Pass to anyone except the person directly beside you.",
      "Call the receiver's name before passing.",
      "After passing, move to the receiver's spot.",
      "Keep the ball moving with no drops."
    ],
    coaching: ["Hands ready at all times.", "Use names loudly and clearly.", "Move right after the pass."],
    progressions: ["Add a second ball.", "Use bounce passes only.", "One mistake equals a quick team reset."],
    example: "Example: Team tries for 30 clean passes in a row. Add a second ball after success."
  },
  {
    id: "dribble-tag",
    title: "Dribble Tag",
    section: "Warm-Up / Conditioning",
    skill: "Ball Handling",
    difficulty: "Beginner",
    players: "4+",
    time: "5-10 min",
    equipment: "1 ball per player, cones",
    diagram: "dribbleTag",
    summary: "Fun ball-control warm-up where players must keep dribbling while avoiding tags.",
    setup: "Create a safe boundary. Every player has a ball. Pick one or two taggers.",
    steps: [
      "All players dribble inside the boundary.",
      "Taggers try to tag others while keeping their own dribble alive.",
      "Tagged players do 5 stationary crossovers and rejoin.",
      "Switch taggers every minute."
    ],
    coaching: ["Eyes up to see space and taggers.", "Change speed and direction.", "Keep dribble controlled, not wild."],
    progressions: ["Weak hand only.", "Shrink the boundary.", "Tagged players become taggers."],
    example: "Example: 3 rounds of 90 seconds. Round 1 any hand, Round 2 weak hand, Round 3 crossover before changing direction."
  },
  {
    id: "full-court-relay",
    title: "Full-Court Skill Relay",
    section: "Warm-Up / Conditioning",
    skill: "Conditioning",
    difficulty: "Beginner",
    players: "4+",
    time: "8-10 min",
    equipment: "1 ball per line, cones",
    diagram: "relay",
    summary: "Team relay that mixes dribbling, speed, and finishing.",
    setup: "Split players into lines on the baseline. Place cones near half court and far free-throw line.",
    steps: [
      "First player dribbles to cone one and changes direction.",
      "Dribble to cone two and make another move.",
      "Finish with a layup or short shot.",
      "Rebound, dribble back, and hand off to the next teammate."
    ],
    coaching: ["Control before speed.", "Use a real move at each cone.", "Encourage teammates positively."],
    progressions: ["Require weak-hand dribbling back.", "Missed layup means player must finish before returning.", "Add different moves for each round."],
    example: "Example: Round 1 crossover, Round 2 behind-the-back, Round 3 retreat dribble, Round 4 player choice."
  },
  {
    id: "mirror-slides",
    title: "Mirror Slides",
    section: "Warm-Up / Conditioning",
    skill: "Defence",
    difficulty: "Beginner",
    players: "2+",
    time: "5-8 min",
    equipment: "Cones or lane lines",
    diagram: "mirror",
    summary: "Players mirror a leader's slides to build defensive quickness and reaction time.",
    setup: "Partners face each other inside a lane or cone box. One is leader, one is mirror.",
    steps: [
      "Leader slides side to side without leaving the area.",
      "Mirror tries to stay directly in front.",
      "Leader changes speed and direction.",
      "Switch roles every 20-30 seconds."
    ],
    coaching: ["Stay low and balanced.", "Do not cross feet.", "React with hips and feet, not by standing up."],
    progressions: ["Add a ball for the leader to dribble.", "Make the space wider.", "Mirror earns a point if they stay even for the whole round."],
    example: "Example: 4 rounds of 25 seconds per partner, with 15 seconds rest between rounds."
  },
  {
    id: "numbers-shooting",
    title: "Number Call Shooting",
    section: "Team",
    skill: "Shooting",
    difficulty: "Intermediate",
    players: "5+",
    time: "8-12 min",
    equipment: "1-2 balls, hoop",
    diagram: "numberSpots",
    summary: "Players react to numbered spots, sprint into shots, and rebound for teammates.",
    setup: "Mark 5-7 shooting spots and number them. Players line up with a passer/rebounder.",
    steps: [
      "Coach calls a number.",
      "Shooter sprints to that spot.",
      "Passer delivers the ball to the shooting pocket.",
      "Shooter shoots, follows, and rotates."
    ],
    coaching: ["Sprint to the spot, then get balanced.", "Passers need timing and accuracy.", "Shot prep starts before the catch."],
    progressions: ["Call two numbers for a sprint fake-out.", "Add a closeout defender.", "Team goal: 15 makes in 4 minutes."],
    example: "Example: Coach calls 3, shooter sprints to right elbow for a catch-and-shoot jumper."
  },
  {
    id: "cut-fill",
    title: "Cut and Fill Motion",
    section: "Team",
    skill: "Offence",
    difficulty: "Beginner",
    players: "5+",
    time: "10-15 min",
    equipment: "1 ball, half court",
    diagram: "cutFill",
    summary: "Teach basic motion spacing: pass, cut, and fill the empty spot.",
    setup: "Five players spaced around the perimeter. Ball starts at the top.",
    steps: [
      "Player passes to a teammate.",
      "Passer basket cuts hard through the lane.",
      "Nearest teammate fills the empty spot.",
      "Cutter exits to an open perimeter spot and the drill continues."
    ],
    coaching: ["Cut hard, even if you do not get the ball.", "Fill spots quickly to keep spacing.", "Passers should look at the cutter before swinging."],
    progressions: ["Add defence after the pattern is clean.", "Allow back cuts if overplayed.", "Score only after a cut or fill action."],
    example: "Example: Top passes wing and cuts; opposite wing fills top; corner fills wing; cutter exits corner."
  },
  {
    id: "baseline-out-of-bounds",
    title: "Baseline Out-of-Bounds Walkthrough",
    section: "Team",
    skill: "Special Situations",
    difficulty: "Beginner",
    players: "5+",
    time: "8-12 min",
    equipment: "1 ball, half court",
    diagram: "blob",
    summary: "Practise getting open and making safe passes from the baseline.",
    setup: "Inbounder stands on baseline. Four teammates set up in a box around the lane.",
    steps: [
      "Coach calls the play name or option.",
      "Players screen, cut, or pop to assigned spaces.",
      "Inbounder reads the first open target.",
      "Finish with a layup, short shot, or reset pass."
    ],
    coaching: ["Inbounder should fake a pass before throwing.", "Cutters must change speed.", "Screeners should open to the ball after screening."],
    progressions: ["Add live defenders.", "Give offence 5 seconds to inbound.", "Create two scoring options and one safety option."],
    example: "Example: Box set: low players screen up, high players cut to corners, screeners open to the rim."
  }
];

const skillOptions = [...new Set(drills.map(d => d.skill))].sort();
const searchInput = document.getElementById("searchInput");
const sectionFilter = document.getElementById("sectionFilter");
const skillFilter = document.getElementById("skillFilter");
const difficultyFilter = document.getElementById("difficultyFilter");
const grid = document.getElementById("drillsGrid");
const drillCount = document.getElementById("drillCount");
const resultsTitle = document.getElementById("resultsTitle");
const resultsMeta = document.getElementById("resultsMeta");
const planList = document.getElementById("planList");
const clearPlanBtn = document.getElementById("clearPlanBtn");
const dialog = document.getElementById("drillDialog");
const dialogContent = document.getElementById("dialogContent");
const closeDialog = document.getElementById("closeDialog");
const randomBtn = document.getElementById("randomBtn");
const printBtn = document.getElementById("printBtn");

let planIds = JSON.parse(localStorage.getItem("basketballDrillPlan") || "[]");

function savePlan() {
  localStorage.setItem("basketballDrillPlan", JSON.stringify(planIds));
}

function escapeHtml(str = "") {
  return String(str).replace(/[&<>"]/g, s => ({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;"}[s]));
}

function listItems(items) {
  return items.map(item => `<li>${escapeHtml(item)}</li>`).join("");
}

function populateSkills() {
  skillOptions.forEach(skill => {
    const opt = document.createElement("option");
    opt.value = skill;
    opt.textContent = skill;
    skillFilter.appendChild(opt);
  });
}

function getFilteredDrills() {
  const q = searchInput.value.trim().toLowerCase();
  const section = sectionFilter.value;
  const skill = skillFilter.value;
  const difficulty = difficultyFilter.value;

  return drills.filter(d => {
    const blob = `${d.title} ${d.section} ${d.skill} ${d.difficulty} ${d.summary} ${d.setup} ${d.steps.join(" ")} ${d.coaching.join(" ")}`.toLowerCase();
    return (section === "all" || d.section === section) &&
      (skill === "all" || d.skill === skill) &&
      (difficulty === "all" || d.difficulty === difficulty) &&
      (!q || blob.includes(q));
  });
}

function render() {
  const filtered = getFilteredDrills();
  drillCount.textContent = drills.length;
  resultsTitle.textContent = sectionFilter.value === "all" ? "All Drills" : sectionFilter.value;
  resultsMeta.textContent = `${filtered.length} shown • ${planIds.length} in practice plan`;
  grid.innerHTML = "";

  if (!filtered.length) {
    grid.appendChild(document.getElementById("emptyTemplate").content.cloneNode(true));
    return;
  }

  filtered.forEach(drill => {
    const card = document.createElement("article");
    card.className = "drill-card";
    const isAdded = planIds.includes(drill.id);
    card.innerHTML = `
      <div class="card-top">${courtSvg(drill.diagram, drill.title)}</div>
      <div class="card-body">
        <div class="tags">
          <span class="tag section">${escapeHtml(drill.section)}</span>
          <span class="tag">${escapeHtml(drill.skill)}</span>
          <span class="tag">${escapeHtml(drill.difficulty)}</span>
        </div>
        <h3>${escapeHtml(drill.title)}</h3>
        <p class="summary">${escapeHtml(drill.summary)}</p>
        <div class="meta-grid">
          <div class="meta-item"><small>Players</small><strong>${escapeHtml(drill.players)}</strong></div>
          <div class="meta-item"><small>Time</small><strong>${escapeHtml(drill.time)}</strong></div>
        </div>
        <div class="card-actions">
          <button class="card-btn" data-open="${drill.id}">View Drill</button>
          <button class="card-btn ${isAdded ? "added" : ""}" data-plan="${drill.id}">${isAdded ? "Added" : "Add to Plan"}</button>
        </div>
      </div>
    `;
    grid.appendChild(card);
  });

  renderPlan();
}

function renderPlan() {
  planList.innerHTML = "";
  if (!planIds.length) {
    planList.innerHTML = `<span class="summary">No drills added yet.</span>`;
    return;
  }
  planIds.map(id => drills.find(d => d.id === id)).filter(Boolean).forEach(drill => {
    const pill = document.createElement("span");
    pill.className = "plan-pill";
    pill.innerHTML = `${escapeHtml(drill.title)} <button aria-label="Remove ${escapeHtml(drill.title)}" data-remove="${drill.id}">×</button>`;
    planList.appendChild(pill);
  });
}

function openDrill(id) {
  const drill = drills.find(d => d.id === id);
  if (!drill) return;
  const isAdded = planIds.includes(drill.id);
  dialogContent.innerHTML = `
    <section class="dialog-hero">
      <div class="dialog-hero__text">
        <div class="tags">
          <span class="tag section">${escapeHtml(drill.section)}</span>
          <span class="tag">${escapeHtml(drill.skill)}</span>
          <span class="tag">${escapeHtml(drill.difficulty)}</span>
        </div>
        <h2>${escapeHtml(drill.title)}</h2>
        <p>${escapeHtml(drill.summary)}</p>
        <div class="meta-grid">
          <div class="meta-item"><small>Players</small><strong>${escapeHtml(drill.players)}</strong></div>
          <div class="meta-item"><small>Time</small><strong>${escapeHtml(drill.time)}</strong></div>
          <div class="meta-item"><small>Equipment</small><strong>${escapeHtml(drill.equipment)}</strong></div>
          <div class="meta-item"><small>Focus</small><strong>${escapeHtml(drill.skill)}</strong></div>
        </div>
        <p><button class="card-btn ${isAdded ? "added" : ""}" data-plan="${drill.id}">${isAdded ? "Added to Plan" : "Add to Plan"}</button></p>
      </div>
      <div class="dialog-hero__diagram">${courtSvg(drill.diagram, drill.title)}</div>
    </section>
    <section class="dialog-body">
      <div class="detail-panel full"><h3>Illustrative Example</h3><p class="summary">${escapeHtml(drill.example)}</p></div>
      <div class="detail-panel"><h3>Setup</h3><p class="summary">${escapeHtml(drill.setup)}</p></div>
      <div class="detail-panel"><h3>How to Run It</h3><ol>${listItems(drill.steps)}</ol></div>
      <div class="detail-panel"><h3>Coaching Cues</h3><ul>${listItems(drill.coaching)}</ul></div>
      <div class="detail-panel"><h3>Progressions</h3><ul>${listItems(drill.progressions)}</ul></div>
    </section>
  `;
  if (!dialog.open) {
    if (typeof dialog.showModal === "function") dialog.showModal();
    else dialog.setAttribute("open", "");
  }
}

function togglePlan(id) {
  if (planIds.includes(id)) {
    planIds = planIds.filter(existing => existing !== id);
  } else {
    planIds.push(id);
  }
  savePlan();
  render();
  const openId = dialog.open ? id : null;
  if (dialog.open && openId) openDrill(id);
}

function pickRandom() {
  const filtered = getFilteredDrills();
  const pool = filtered.length ? filtered : drills;
  const drill = pool[Math.floor(Math.random() * pool.length)];
  openDrill(drill.id);
}

function printPlan() {
  const plan = planIds.map(id => drills.find(d => d.id === id)).filter(Boolean);
  const source = plan.length ? plan : getFilteredDrills();
  const printWindow = window.open("", "_blank");
  const content = source.map((d, index) => `
    <article class="print-drill">
      <h2>${index + 1}. ${escapeHtml(d.title)}</h2>
      <p><strong>${escapeHtml(d.section)}</strong> • ${escapeHtml(d.skill)} • ${escapeHtml(d.difficulty)} • ${escapeHtml(d.players)} players • ${escapeHtml(d.time)}</p>
      <p>${escapeHtml(d.summary)}</p>
      <p><strong>Example:</strong> ${escapeHtml(d.example)}</p>
      <h3>Setup</h3><p>${escapeHtml(d.setup)}</p>
      <h3>Steps</h3><ol>${listItems(d.steps)}</ol>
      <h3>Coaching Cues</h3><ul>${listItems(d.coaching)}</ul>
    </article>
  `).join("");
  printWindow.document.write(`<!doctype html><html><head><title>Basketball Drill Plan</title><style>
    body{font-family:Arial,sans-serif;margin:28px;color:#222;} h1{font-size:30px;} .print-drill{break-inside:avoid;border:1px solid #ddd;border-radius:14px;padding:16px;margin:0 0 16px;} p,li{line-height:1.45;} @media print{button{display:none;}}
  </style></head><body><button onclick="window.print()">Print / Save as PDF</button><h1>Basketball Drill Plan</h1><p>${source.length} drills</p>${content}</body></html>`);
  printWindow.document.close();
}

function courtSvg(type, title) {
  const c = {
    bg: "#f6a64d",
    line: "#fff7ea",
    dark: "#25314f",
    accent: "#d85f13",
    blue: "#2f5f9f",
    green: "#2f7d56"
  };
  const arrowStroke = 4;
  const arrowHead = 6.5;
  const arrowRefX = 5.8;
  const base = `
    <svg class="diagram" viewBox="0 0 420 260" role="img" aria-label="Diagram for ${escapeHtml(title)}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <marker id="arrow-${type}" markerWidth="${arrowHead}" markerHeight="${arrowHead}" refX="${arrowRefX}" refY="2.5" orient="auto" markerUnits="strokeWidth"><path d="M0,0 L0,5 L5.8,2.5 z" fill="${c.dark}" /></marker>
        <marker id="arrowA-${type}" markerWidth="${arrowHead}" markerHeight="${arrowHead}" refX="${arrowRefX}" refY="2.5" orient="auto" markerUnits="strokeWidth"><path d="M0,0 L0,5 L5.8,2.5 z" fill="${c.accent}" /></marker>
      </defs>
      <rect width="420" height="260" rx="18" fill="${c.bg}" />
      <rect x="14" y="14" width="392" height="232" rx="10" fill="none" stroke="${c.line}" stroke-width="4"/>
      <line x1="210" y1="14" x2="210" y2="246" stroke="${c.line}" stroke-width="3" opacity=".55"/>
      <circle cx="210" cy="130" r="34" fill="none" stroke="${c.line}" stroke-width="3" opacity=".55"/>
      <rect x="14" y="76" width="84" height="108" fill="none" stroke="${c.line}" stroke-width="4"/>
      <rect x="322" y="76" width="84" height="108" fill="none" stroke="${c.line}" stroke-width="4"/>
      <path d="M98 78 A58 58 0 0 1 98 182" fill="none" stroke="${c.line}" stroke-width="3" opacity=".75"/>
      <path d="M322 78 A58 58 0 0 0 322 182" fill="none" stroke="${c.line}" stroke-width="3" opacity=".75"/>
      <circle cx="68" cy="130" r="8" fill="none" stroke="${c.line}" stroke-width="4"/>
      <circle cx="352" cy="130" r="8" fill="none" stroke="${c.line}" stroke-width="4"/>
  `;
  const end = `</svg>`;
  const player = (x,y,label="P",fill=c.dark) => `<g><circle cx="${x}" cy="${y}" r="13" fill="${fill}"/><text x="${x}" y="${y+4}" text-anchor="middle" font-size="11" font-weight="800" fill="white">${label}</text></g>`;
  const cone = (x,y) => `<path d="M${x} ${y-12} L${x-10} ${y+11} L${x+10} ${y+11} Z" fill="${c.accent}" stroke="white" stroke-width="2"/>`;
  const ball = (x,y) => `<circle cx="${x}" cy="${y}" r="7" fill="#7a320b" stroke="white" stroke-width="2"/>`;
  const arrow = (x1,y1,x2,y2,accent=false,dashed=false) => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${accent ? c.accent : c.dark}" stroke-width="${arrowStroke}" stroke-linecap="round" ${dashed ? 'stroke-dasharray="8 8"' : ''} marker-end="url(#${accent ? "arrowA" : "arrow"}-${type})" opacity=".9"/>`;
  const spot = (x,y,n="") => `<g><circle cx="${x}" cy="${y}" r="10" fill="white" stroke="${c.dark}" stroke-width="3"/><text x="${x}" y="${y+4}" text-anchor="middle" font-size="10" font-weight="900" fill="${c.dark}">${n}</text></g>`;

  const diagrams = {
    shootingSpots: () => [spot(70,130,"1"), spot(60,98,"2"), spot(60,162,"3"), spot(108,84,"4"), spot(108,176,"5"), player(134,130,"S"), ...[arrow(128,130,78,130)]].join(""),
    mikan: () => [player(70,111,"R"), player(70,149,"L"), arrow(70,111,70,126), arrow(70,149,70,134), ball(88,112), ball(88,148)].join(""),
    zigzag: () => [cone(146,70), cone(103,101), cone(146,132), cone(103,163), cone(146,194), player(74,52,"P"), arrow(80,58,137,70), arrow(140,75,106,100), arrow(106,106,142,130), arrow(142,136,107,162), arrow(107,168,140,193)].join(""),
    stationaryHandles: () => [player(210,130,"P"), ball(184,139), ball(236,139), `<path d="M176 160 C200 190, 220 190, 244 160" fill="none" stroke="${c.dark}" stroke-width="5" stroke-dasharray="8 8"/>`, spot(210,70,"eyes")].join(""),
    pullup: () => [cone(150,92), player(220,60,"S"), arrow(213,65,158,88), arrow(150,100,112,116,true), spot(118,122,"J")].join(""),
    freeThrow: () => [player(148,130,"S"), ball(132,130), arrow(137,130,76,130), `<text x="138" y="164" font-size="16" font-weight="900" fill="${c.dark}">routine → shoot</text>`].join(""),
    bankSpots: () => [spot(65,96,"1"), spot(65,164,"2"), spot(105,75,"3"), spot(105,185,"4"), arrow(66,96,70,126), arrow(66,164,70,134)].join(""),
    jabFinish: () => [player(175,70,"S"), cone(137,99), arrow(171,75,145,95,true), arrow(145,98,78,126), ball(158,73)].join(""),
    spinFinish: () => [player(180,180,"S"), cone(126,152), arrow(174,176,135,154), `<path d="M132 150 C106 142, 96 126, 82 126" fill="none" stroke="${c.accent}" stroke-width="${arrowStroke}" marker-end="url(#arrowA-${type})"/>`].join(""),
    floater: () => [player(176,85,"S"), cone(104,116), arrow(170,90,114,115), arrow(109,116,77,128,true), spot(102,120,"F")].join(""),
    wallPass: () => [`<rect x="315" y="72" width="64" height="116" rx="8" fill="#fff7ea" stroke="${c.dark}" stroke-width="4"/>`, `<circle cx="347" cy="130" r="18" fill="none" stroke="${c.accent}" stroke-width="4"/>`, player(190,130,"P"), arrow(203,130,326,130), arrow(326,142,206,142,true,true)].join(""),
    slideBox: () => [cone(160,72), cone(260,72), cone(260,172), cone(160,172), player(160,72,"D"), arrow(172,72,246,72), arrow(260,84,260,158), arrow(248,172,174,172), arrow(160,160,160,86)].join(""),
    aroundWorld: () => [spot(66,66,"1"), spot(108,83,"2"), spot(140,130,"3"), spot(108,177,"4"), spot(66,194,"5"), spot(156,62,"6"), spot(156,198,"7")].join(""),
    twoSpotSprint: () => [spot(124,90,"A"), spot(124,170,"B"), player(124,90,"S"), arrow(124,103,124,157,true,true), arrow(124,157,124,103,false,true)].join(""),
    partnerPass: () => [player(150,130,"A"), player(270,130,"B"), arrow(164,126,256,126), arrow(256,142,164,142,true)].join(""),
    closeout: () => [player(150,84,"O",c.accent), player(112,130,"D",c.dark), ball(123,127), arrow(122,125,146,91,true), arrow(112,130,143,92,false,true), spot(150,84,"shot")].join(""),
    giveGo: () => [player(152,82,"A",c.accent), player(220,132,"B",c.dark), arrow(162,88,209,126,true), arrow(155,92,83,124), arrow(209,128,90,126,true)].join(""),
    catchShoot: () => [player(86,130,"R"), player(150,72,"S",c.accent), arrow(92,126,143,81,true), spot(150,72,"J")].join(""),
    twoBallPass: () => [player(150,110,"A"), player(270,150,"B"), ball(164,110), ball(256,150), arrow(164,112,255,144), arrow(256,150,165,118,true)].join(""),
    coneGate: () => [cone(168,92), cone(168,150), player(230,120,"O",c.accent), player(120,120,"D"), arrow(222,120,174,120,true), arrow(172,120,84,128,true)].join(""),
    rebounding: () => [player(93,116,"D"), player(110,145,"O",c.accent), ball(70,130), arrow(90,117,108,142), `<path d="M75 126 C120 88, 145 104, 112 142" fill="none" stroke="${c.accent}" stroke-width="4" stroke-dasharray="7 7"/>`].join(""),
    weave: () => [player(60,70,"1"), player(60,130,"2"), player(60,190,"3"), arrow(72,130,118,82,true), arrow(123,82,170,178,true), arrow(174,178,238,126,true), arrow(239,126,330,130)].join(""),
    shell: () => [player(120,70,"O",c.accent), player(210,58,"O",c.accent), player(300,70,"O",c.accent), player(210,202,"O",c.accent), player(130,110,"D"), player(210,98,"D"), player(290,110,"D"), player(210,158,"D"), arrow(121,70,209,58,true), arrow(210,58,299,70,true), arrow(299,70,211,202,true)].join(""),
    transition: () => [player(55,80,"O",c.accent), player(55,130,"O",c.accent), player(55,180,"O",c.accent), player(250,105,"D"), player(250,155,"D"), arrow(69,130,238,130,true), arrow(69,80,337,112,true), arrow(69,180,337,148,true)].join(""),
    fiveOut: () => [player(170,45,"O",c.accent), player(93,87,"O",c.accent), player(93,173,"O",c.accent), player(178,215,"O",c.accent), player(250,130,"O",c.accent), arrow(170,52,122,113,true), arrow(122,113,212,130,true)].join(""),
    lanes: () => [player(55,70,"W",c.accent), player(55,130,"M",c.accent), player(55,190,"W",c.accent), arrow(69,70,332,82,true), arrow(69,130,288,130,true), arrow(69,190,332,178,true), arrow(288,130,342,104,true)].join(""),
    numberedBreak: () => [player(58,58,"1"), player(58,96,"2"), player(58,134,"3"), player(58,172,"4"), player(58,210,"5"), arrow(74,58,210,90,true), arrow(74,134,270,130,true), arrow(74,210,210,170,true)].join(""),
    screenAway: () => [player(210,58,"A",c.accent), player(120,88,"B",c.accent), player(300,88,"C",c.accent), arrow(210,58,123,88,true), arrow(204,64,292,88), arrow(300,88,246,126,true)].join(""),
    bumpCutter: () => [player(118,76,"O",c.accent), player(298,76,"O",c.accent), player(210,180,"O",c.accent), player(205,126,"D"), arrow(298,76,210,178,true), arrow(205,126,222,151)].join(""),
    war: () => [player(95,102,"D"), player(112,152,"D"), player(132,118,"O",c.accent), player(132,168,"O",c.accent), ball(70,130), `<path d="M70 130 C128 70, 177 102, 128 152" fill="none" stroke="${c.dark}" stroke-width="4" stroke-dasharray="7 7"/>`].join(""),
    closeoutBox: () => [player(180,72,"O",c.accent), player(116,130,"D"), arrow(116,130,172,80,false,true), arrow(180,72,76,130,true), player(96,148,"R",c.green)].join(""),
    layupLines: () => [player(170,72,"S",c.accent), player(170,188,"R"), arrow(166,79,75,125,true), arrow(76,135,168,185)].join(""),
    advantage: () => [player(160,64,"O",c.accent), player(98,118,"O",c.accent), player(160,196,"O",c.accent), player(275,130,"O",c.accent), player(150,118,"D"), player(198,130,"D"), player(150,154,"D"), arrow(160,64,98,118,true), arrow(98,118,275,130,true)].join(""),
    circle: () => [player(210,52,"1"), player(285,98,"2"), player(268,178,"3"), player(152,178,"4"), player(135,98,"5"), arrow(210,52,283,98,true), arrow(283,98,154,178,true), arrow(154,178,266,178,true)].join(""),
    dribbleTag: () => [cone(95,65), cone(320,65), cone(320,195), cone(95,195), player(150,110,"T"), player(240,100,"P",c.accent), player(270,170,"P",c.accent), player(135,170,"P",c.accent), arrow(150,110,230,102), arrow(240,100,270,160,true)].join(""),
    relay: () => [player(58,80,"1"), player(58,130,"2"), player(58,180,"3"), cone(160,130), cone(280,130), arrow(70,80,155,130,true), arrow(160,130,280,130,true), arrow(280,130,350,130,true)].join(""),
    mirror: () => [player(170,130,"L",c.accent), player(235,130,"M"), arrow(158,130,110,130,true), arrow(182,130,224,130), arrow(247,130,292,130)].join(""),
    numberSpots: () => [spot(90,65,"1"), spot(138,90,"2"), spot(160,130,"3"), spot(138,170,"4"), spot(90,195,"5"), player(255,130,"P"), arrow(255,130,160,130,true)].join(""),
    cutFill: () => [player(210,58,"1",c.accent), player(115,90,"2",c.accent), player(305,90,"3",c.accent), player(115,190,"4",c.accent), player(305,190,"5",c.accent), arrow(210,58,116,90,true), arrow(210,65,70,130), arrow(305,90,210,58)].join(""),
    blob: () => [player(42,130,"In",c.green), player(120,95,"O",c.accent), player(120,165,"O",c.accent), player(178,95,"O",c.accent), player(178,165,"O",c.accent), arrow(120,95,178,95), arrow(178,165,90,130,true), arrow(42,130,92,130,true)].join("")
  };
  const body = (diagrams[type] || diagrams.shootingSpots)();
  return base + body + end;
}

[searchInput, sectionFilter, skillFilter, difficultyFilter].forEach(el => el.addEventListener("input", render));

grid.addEventListener("click", e => {
  const openId = e.target.closest("[data-open]")?.dataset.open;
  const planId = e.target.closest("[data-plan]")?.dataset.plan;
  if (openId) openDrill(openId);
  if (planId) togglePlan(planId);
});

dialogContent.addEventListener("click", e => {
  const planId = e.target.closest("[data-plan]")?.dataset.plan;
  if (planId) togglePlan(planId);
});

planList.addEventListener("click", e => {
  const removeId = e.target.closest("[data-remove]")?.dataset.remove;
  if (removeId) {
    planIds = planIds.filter(id => id !== removeId);
    savePlan();
    render();
  }
});

clearPlanBtn.addEventListener("click", () => {
  planIds = [];
  savePlan();
  render();
});

closeDialog.addEventListener("click", () => dialog.close());
dialog.addEventListener("click", e => {
  const rect = dialog.getBoundingClientRect();
  const clickedOutside = e.clientX < rect.left || e.clientX > rect.right || e.clientY < rect.top || e.clientY > rect.bottom;
  if (clickedOutside) dialog.close();
});
randomBtn.addEventListener("click", pickRandom);
printBtn.addEventListener("click", printPlan);

populateSkills();
render();

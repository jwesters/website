#!/usr/bin/env python3
'''
make_indexGen.py

Generate a polished static index page for jwesters.github.io/website or a similar folder tree.

What this version does differently:
- Groups apps by what they are for, not just by repository folder.
- Keeps a Recently Changed section at the bottom.
- Keeps an optional repository-folder view at the bottom for maintenance.
- Excludes root-level files by default, matching the previous generator.
- Can hide filenames containing "nsfw" with --hide-nsfw.
- Also writes an education-only indexEDU.html by default.
- Always keeps NSFW filenames/paths out of indexEDU.html.
- Uses only the Python standard library.

Examples:
  python make_indexGen.py
  python make_indexGen.py --root .
  python make_indexGen.py --root "C:\\Users\\you\\Documents\\website"
  python make_indexGen.py --ext .html --ext .pdf
  python make_indexGen.py --exclude-dir .git --exclude-dir node_modules
  python make_indexGen.py --hide-nsfw
  python make_indexGen.py --out index.html
  python make_indexGen.py --no-folder-view
'''

from __future__ import annotations

import argparse
import os
import re
from dataclasses import dataclass, field
from datetime import datetime
from pathlib import Path
from typing import Dict, Iterable, List, Sequence, Tuple
from urllib.parse import quote


# ---------------------------------------------------------------------------
# Icons
# ---------------------------------------------------------------------------

# Exact file/folder icon overrides. These are used before keyword rules.
CUSTOM_ICONS = {'BillboardNumberOne.html': '🎵',
 'HockeyStats.html': '🏒',
 'RealCityOrNot.html': '🌆',
 'SoccerStats.html': '⚽',
 'WeightGame.html': '⚖️',
 'binaryDLE.html': '💾',
 'CanPrices.html': '🥫',
 'CityPop.html': '🌆',
 'polygon_guess.html': '🔷',
 'truth_or_bologna.html': '🤔',
 'Acrostic-Poem-Builder.html': '📝',
 'create_a_wordle.html': '🟩',
 'fry-speak-check-300.html': '🗣️',
 'haiku-checker.html': '🌸',
 'PWIM_Shareable_Link_Annotator.html': '🖼️',
 'RAFT_Randomizer.html': '🎲',
 'word_scrambler_maker.html': '🔤',
 '10frames.html': '🧮',
 'magic-square-generator.html': '🔢',
 'Math_Questions_Generator.html': '❓',
 'dice_roller.html': '🎲',
 'Random_Card.html': '🃏',
 'attendance_maker.html': '✅',
 'draw_from_memory.html': '🧠',
 'ELA6_practice_site.html': '📖',
 'grade5_science.html': '🔬',
 'pitch_higher_quiz.html': '🎼',
 'QR_Creator.html': '🔳',
 'random_group_maker_offline.html': '👥',
 'rorschach.html': '🪞',
 'scattergories.html': '💡',
 'science6_practice_site.html': '🧪',
 'word_cloud_builder.html': '☁️',
 'WordSearchGenerator.html': '🔎',
 'anti-dots-and-boxes.html': '◻️',
 'antiSOS.html': '🆘',
 'Ataxx_Clone.html': '⚔️',
 'black-hole.html': '⚫',
 'bomb_hunt_minesweeper.html': '💣',
 'bridgit.html': '🌉',
 'classic_minesweeper.html': '💣',
 'dots-and-boxes.html': '◼️',
 'HexaSudoku.html': '🔢',
 'HexVariants.html': '⬡',
 'hold-the-line.html': '📏',
 'NIM.html': '🪙',
 'Obstruction.html': '🚧',
 'ShikakuBlanks.html': '▭',
 'tetromino-battleship.html': '🚢',
 'exact-four-10x10.html': '4️⃣',
 'expandable-tic-tac-toe-4inarow.html': '❌',
 'order-and-chaos.html': '🔀',
 'row_call.html': '📣',
 'antiSimon.html': '🔁',
 'CrazyJezzball.html': '⚪',
 'drop67.html': '🎲',
 'ghost_vs_pacman.html': '👻',
 'LineDraw.html': '✏️',
 'pong.html': '🏓',
 'SIM.html': '🧠',
 'Wheel_Of_Fortune.html': '🎡',
 'word-ladder.html': '🪜',
 'Typing_Test.html': '⌨️',
 'Rotate_Tetris.html': '🧱',
 'Tetris_Left_to_Right.html': '🧱',
 'Tetris_No_Rotate.html': '🧱',
 'Tetris_Random.html': '🧱',
 'Tetris_Reverse_Gravity.html': '🧱',
 'Tetris_Right_to_Left.html': '🧱',
 'DLE_and_ThisOrThat_Games': '🟩',
 'Math_Games': '➗',
 'Misc': '🧰',
 'Misc_Games': '🎮',
 'Tetris_Games': '🧱',
 'SnakesAndLadders.html': '🎲',
 'snakes_and_ladders.html': '🎲',
 'Go.html': '⚫',
 'go_game.html': '⚫',
 'Scrabble.html': '🔠',
 'scrabble_like_game.html': '🔠',
 'ascii_art_generator.html': '🖼️',
 'Image_to_ASCII_Art.html': '🎨',
 'Pool-ball Drop Stack.html': '🎱',
 'pool_ball_drop_stack.html': '🎱',
 'Paint_Maze_Arcade.html': '🎨',
 'paint_maze_arcade.html': '🎨',
 'Arrow_Escape.html': '🏹',
 'arrow_escape.html': '🏹',
 'Stacker.html': '🧱',
 'autorunner.html': '🏃',
 'snake.html': '🐍',
 'word_definition_quiz.html': '📚',
 'image_to_ascii_art.html': '🎨',
 'Teacher_Tools': '🍎',
 'Subject_Specific': '📚',
 'Art Related': '🎨',
 'Epub_Reader': '📚',
 'Music': '🎵',
 'Ear_Training': '👂',
 'ArcadeGames': '🕹️',
 'CardGames': '🃏',
 'Card_Games': '🃏',
 'cardgames': '🃏',
 'card_games': '🃏',
 'ChessGames': '♟️',
 'Strategy_Games': '♟️',
 'WordGames': '🔤',
 'SubjectTests': '📝',
 'ELA': '📖',
 'Science': '🔬',
 'Math': '➗',
 'Mazes': '🧩',
 'Hangman': '🪓',
 'BillboardNumberOnes': '🎵',
 'HockeyStats': '🏒',
 'RealCityOrNot': '🌆',
 'SoccerStats': '⚽',
 'WeightGame': '⚖️',
 'TicTacToeGames': '❌',
 'MathBingo': '🎟️',
 'MathFacts': '⏱️',
 'Random': '🎲',
 'Shikaku': '▭',
 'typing_tetris': '⌨️',
 'Scrabble100': '🔠',
 'BingoCardGenerator.html': '🎟️',
 'MathBingo.html': '🎟️',
 'FactsCountDown.html': '⏱️',
 'FactsCountUp.html': '⏱️',
 'AlgFactsCountUp.html': '𝑥',
 'multiplication_practice_app.html': '✖️',
 'Division_2_and_3.html': '➗',
 'Multi_2_and_3.html': '✖️',
 'Four_Facts_Race_Time.html': '⏱️',
 'OperationMemory.html': '🧠',
 'OperationsGames.html': '➕',
 'input_output_machine_numbers.html': '🔁',
 'input_output_machine.html': '🔁',
 '15-TicTacToe.html': '❌',
 '7dice.html': '🎲',
 'CartesianTicTacToe.html': '📍',
 'decimal_guess_number.html': '🔢',
 'Dice_Grid_Game.html': '🎲',
 'Divisibility-rules-2-10.html': '➗',
 'lying_guess_number.html': '🤥',
 'Math-Crossword.html': '➗',
 'PEDMASgame.html': '🧮',
 'target_number_golf.html': '⛳',
 'Telling_Time.html': '⏰',
 'blank_comic_strip_generator.html': '💬',
 'pointillism_art_maker.html': '🖌️',
 'reveal_color_app.html': '🌈',
 'Epub_Reader.html': '📖',
 'Mobile-Epub_Reader.html': '📱',
 'clickable_aac_word_board.html': '🗣️',
 'madlib_story_maker.html': '✍️',
 'major-system-quiz.html': '🧠',
 'mandala_generator.html': '🌸',
 'oblique_strategies.html': '🎴',
 'Tabata_Maker.html': '⏲️',
 'typing-test.html': '⌨️',
 'breathing_voice_reordered.html': '🫁',
 'alive_for.html': '⏳',
 'build_the_chord.html': '🎹',
 'chord_ear_training.html': '👂',
 'chord_progression_trainer.html': '🎼',
 'ear_training_suite.html': '🎧',
 'interval_ear_training.html': '📏',
 'melody_dictation.html': '🎶',
 'mode_recognition.html': '🎵',
 'note_in_chord.html': '🎹',
 'scale_recognition.html': '🎼',
 'guitar_chord_finder.html': '🎸',
 'guitar_scale_mapper.html': '🎸',
 'ukulele_chord_finder.html': '🪕',
 'ball_runner.html': '🏃',
 'multi-pool_ball_drop_stack.html': '🎱',
 'sky_stacker_endless.html': '🏗️',
 'snake_game.html': '🐍',
 'target_practice_game.html': '🎯',
 'knight-tour-multiplayer.html': '♞',
 'knights-tour-blocked.html': '♞',
 'local_chess_with_cpu.html': '♟️',
 'misere-chess-self-checkmate.html': '♔',
 'misere-chess960-self-checkmate.html': '♔',
 'numdle.html': '🔢',
 'Hangman.html': '🪓',
 'Maze_Creator.html': '🧩',
 'Maze_Creator_Game.html': '🧩',
 'Shikaku.html': '▭',
 'Shikaku_Level_Progression.html': '▭',
 'Go_Local.html': '⚫',
 'hex_merge.html': '⬡',
 'rabbit_hunt.html': '🐇',
 'Tetris_Targets.html': '🎯',
 'ultimate_tic_tac_toe.html': '❌',
 'ultimate_tic_tac_toe_4x4_3inarow.html': '❌',
 'ultimate_tic_tac_toe_5x5.html': '❌',
 'TicTacToe_7x7.html': '❌',
 'Scrabble100.html': '🔠',
 'unusual_words_game.html': '📚',
 'Word_Maker_Game.html': '🔤',
 'word_memory_challenge.html': '🧠',
 'number_memory_challenge.html': '🧠',
 'Canada_Click_Challenge.html': '🗺️',
 'World_Click_Challenge.html': '🌍',
 'checkers_game.html': '🔴',
 'Snakes_And_Ladders.html': '🎲',
 'Timer_Accuracy.html': '⏱️',
 'moon_phases_tutorial_quiz.html': '🌙',
 'Spelling-Test-Audio.html': '🔊',
 'Grade3_Math.html': '➗',
 'Grade5_Math.html': '➗',
 'Grade5_Science.html': '🔬',
 'Grade5_Social.html': '🌎',
 'Grade6_ELA.html': '📖',
 'Grade6_Math.html': '➗',
 'Grade6_Science.html': '🔬',
 'Grade6_Social.html': '🌎'}

# Keyword rules. Longest keyword match wins.
ICON_RULES = [('multiplication', '✖️'),
 ('division', '➗'),
 ('bingo', '🎟️'),
 ('facts', '⏱️'),
 ('crossword', '🧩'),
 ('target_number', '🎯'),
 ('telling_time', '⏰'),
 ('moon_phase', '🌙'),
 ('moon', '🌙'),
 ('comic', '💬'),
 ('speech', '💬'),
 ('bubble', '💬'),
 ('pointillism', '🖌️'),
 ('mandala', '🌸'),
 ('reveal_color', '🌈'),
 ('color', '🌈'),
 ('epub', '📚'),
 ('madlib', '✍️'),
 ('mad_lib', '✍️'),
 ('aac', '🗣️'),
 ('audio', '🔊'),
 ('ear_training', '👂'),
 ('chord', '🎹'),
 ('scale', '🎼'),
 ('interval', '📏'),
 ('melody', '🎶'),
 ('mode', '🎵'),
 ('guitar', '🎸'),
 ('ukulele', '🪕'),
 ('tabata', '⏲️'),
 ('timer', '⏱️'),
 ('breathing', '🫁'),
 ('alive', '⏳'),
 ('checkers', '🔴'),
 ('target_practice', '🎯'),
 ('world_click', '🌍'),
 ('canada_click', '🗺️'),
 ('ultimate', '❌'),
 ('hex', '⬡'),
 ('rabbit', '🐇'),
 ('jezzball', '⚪'),
 ('sky', '🏗️'),
 ('attendance', '✅'),
 ('science', '🔬'),
 ('experiment', '🧪'),
 ('weather', '⛅'),
 ('climate', '🌦️'),
 ('coding', '💻'),
 ('computer', '💻'),
 ('binary', '💾'),
 ('algorithm', '⚙️'),
 ('input_output', '🔁'),
 ('input-output', '🔁'),
 ('input output', '🔁'),
 ('divisibility', '➗'),
 ('decimal', '🔢'),
 ('fraction', '➗'),
 ('algebra', '🧮'),
 ('polygon', '🔷'),
 ('cartesian', '📍'),
 ('operations', '➕'),
 ('pedmas', '🧮'),
 ('number', '🔢'),
 ('count', '🔢'),
 ('math', '➗'),
 ('dice', '🎲'),
 ('spelling', '✎'),
 ('acrostic', '📝'),
 ('haiku', '🌸'),
 ('wordsearch', '🔎'),
 ('word_search', '🔎'),
 ('wordle', '🟩'),
 ('word', '🔤'),
 ('reading', '📖'),
 ('writing', '✍️'),
 ('ela', '🕮'),
 ('vocab', '🧠'),
 ('poem', '📝'),
 ('scrambler', '🔤'),
 ('raft', '📝'),
 ('word_cloud', '☁️'),
 ('cloud', '☁️'),
 ('qr_creator', '🔳'),
 ('qrcode', '🔳'),
 ('qr', '🔳'),
 ('image', '🖼️'),
 ('annotator', '🖍️'),
 ('generator', '⚙️'),
 ('creator', '🛠️'),
 ('builder', '🧰'),
 ('tool', '🛠️'),
 ('randomizer', '🎲'),
 ('tetris', '🧱'),
 ('tetromino', '🧱'),
 ('hangman', '🪓'),
 ('maze', '🧩'),
 ('sudoku', '🔢'),
 ('shikaku', '▭'),
 ('minesweeper', '💣'),
 ('battleship', '🚢'),
 ('tictactoe', '❌'),
 ('tic_tac_toe', '❌'),
 ('tic-tac-toe', '❌'),
 ('chess', '♔'),
 ('knight', '♞'),
 ('cardgames', '🃏'),
 ('card_games', '🃏'),
 ('card-games', '🃏'),
 ('solitaire', '🃏'),
 ('card', '🃏'),
 ('deck', '🃏'),
 ('game', '🎮'),
 ('play', '🎮'),
 ('puzzle', '🧩'),
 ('simon', '🔁'),
 ('fortune', '🎡'),
 ('pacman', '👻'),
 ('ghost', '👻'),
 ('pong', '🏓'),
 ('billboard', '🎵'),
 ('pitch', '🎼'),
 ('hockey', '🏒'),
 ('soccer', '⚽'),
 ('city', '🌆'),
 ('weight', '⚖️'),
 ('time', '⏰'),
 ('clock', '⏰'),
 ('pool', '🎱'),
 ('ball', '🎱'),
 ('paint', '🎨'),
 ('arcade', '🕹️'),
 ('arrow', '🏹'),
 ('escape', '🚪'),
 ('snake', '🐍'),
 ('ladder', '🪜'),
 ('scrabble', '🔠'),
 ('letter', '🔤'),
 ('ascii', '🖼️'),
 ('stack', '🧱'),
 ('runner', '🏃'),
 ('run', '🏃'),
 ('go', '⚫'),
 ('index', '🏠')]

DEFAULT_FOLDER_ICON = "📁"
DEFAULT_FILE_ICON = "📄"


# ---------------------------------------------------------------------------
# Logical category rules
# ---------------------------------------------------------------------------

CATEGORY_ORDER = [
    "Math & Numeracy",
    "Literacy & ELA",
    "Science & Social Studies",
    "Teacher Tools",
    "Art, Media & Creation",
    "Music & Ear Training",
    "Arcade & Action Games",
    "Strategy, Board & Logic Games",
    "Word, Trivia & Quiz Games",
    "Other / Unsorted",
]

CATEGORY_ICONS = {
    "Math & Numeracy": "➗",
    "Literacy & ELA": "📖",
    "Science & Social Studies": "🌎",
    "Teacher Tools": "🍎",
    "Art, Media & Creation": "🎨",
    "Music & Ear Training": "🎵",
    "Arcade & Action Games": "🕹",
    "Strategy, Board & Logic Games": "♟",
    "Word, Trivia & Quiz Games": "🔤",
    "Other / Unsorted": "📁",
}

# Subcategory icons are used as a safe fallback when a filename does not have
# a clear icon match. This prevents a file from inheriting the wrong icon just
# because it lives inside a broad folder such as Science, Social, or ArcadeGames.
SUBCATEGORY_ICONS = {
    "ELA Practice & Spelling": "📖",
    "Writing & Word Work": "✍️",
    "Reading Tools": "📖",
    "Word Work Generators": "🔎",
    "Math Practice & Assessments": "➗",
    "Math Facts & Operations": "⏱️",
    "Multiplication & Division": "✖️",
    "Number Sense & Problem Solving": "🔢",
    "Math Games": "🎲",
    "Science": "🔬",
    "Social Studies": "🌎",
    "Subject Practice & Tests": "📝",
    "Classroom Utilities": "🍎",
    "Accessibility & Communication": "🗣️",
    "Timers & Routines": "⏱️",
    "Art & Image Tools": "🎨",
    "Comic & Annotation Tools": "💬",
    "Ear Training": "👂",
    "Guitar, Chords & Theory": "🎸",
    "Music & Practice Tools": "🎵",
    "Chess & Knight Games": "♟️",
    "Card & Solitaire Games": "🃏",
    "Connect Four Variants": "🔴",
    "Strategy & Logic Games": "♟️",
    "Tic-Tac-Toe Variants": "❌",
    "Mazes & Logic Puzzles": "🧩",
    "Trivia & Guessing Games": "🤔",
    "Word Games": "🔤",
    "Memory Games": "🧠",
    "Geography Games": "🌍",
    "Party & Word Games": "🎡",
    "Other Games": "🎮",
    "Miscellaneous Tools": "🛠️",
}

EDUCATIONAL_CATEGORIES = {
    "Math & Numeracy",
    "Literacy & ELA",
    "Science & Social Studies",
    "Teacher Tools",
    "Art, Media & Creation",
    "Music & Ear Training",
    "Strategy, Board & Logic Games",
    "Word, Trivia & Quiz Games",
}

# Exact filenames that should never appear in indexEDU.html. Exact excludes win
# over category rules and keyword rules. Keep these case-insensitive.
EDUCATIONAL_EXCLUDE_FILENAMES = {
    "alive_for.html",
    "billboardnumberone.html",
    "drop67.html",
    "hockeystats.html",
    "linedraw.html",
    "maze_creator.html",
    "snakes_and_ladders.html",
    "snakesandladders.html",
    "soccerstats.html",
    "weightgame.html",
}

# Specific arcade/action files that are still useful enough for the education
# index. Exact excludes above still win.
EDUCATIONAL_INCLUDE_FILENAMES = {
    "antisimon.html",
}

# Fallback keyword checks are intentionally conservative. They help catch new
# classroom files that have not yet been added to CATEGORY_RULES.
EDUCATIONAL_INCLUDE_KEYWORDS = (
    "algebra",
    "assessment",
    "boggle",
    "cartesian",
    "chess",
    "classroom",
    "decimal",
    "division",
    "ela",
    "english",
    "fraction",
    "grade",
    "grammar",
    "haiku",
    "logic",
    "math",
    "memory",
    "moon",
    "multiplication",
    "pedmas",
    "phonics",
    "poem",
    "quiz",
    "reading",
    "science",
    "scrabble",
    "shikaku",
    "social",
    "spelling",
    "teacher",
    "typing",
    "vocab",
    "word",
    "writing",
)

# Each rule is:
#   (tokens_to_match, category, subcategory)
#
# The first matching rule wins, so keep specific rules above broad rules.
# Tokens are checked against the full relative path and filename.
CATEGORY_RULES: List[Tuple[Tuple[str, ...], str, str]] = [
    # Subject-specific / curriculum folders
    # Keep ELA-specific names here, before Science/Social rules, so files like
    # "Alberta ELA Practice.html" do not fall into a broader Alberta/Social folder grouping.
    ((
        "subject_specific/ela/",
        "grade6_ela",
        "grade5_ela",
        "grade_6_ela",
        "grade_5_ela",
        "ela6",
        "ela5",
        "alberta ela",
        "alberta_ela",
        "ela practice",
        "ela_practice",
        "english language arts",
        "english_language_arts",
        "english-language-arts",
        "language arts",
        "language_arts",
        "spelling-test-audio",
    ), "Literacy & ELA", "ELA Practice & Spelling"),
    (("subject_specific/math/", "grade3_math", "grade5_math", "grade6_math", "math_questions_generator"), "Math & Numeracy", "Math Practice & Assessments"),
    (("grade5_science", "grade6_science", "moon_phases", "subject_specific/science/"), "Science & Social Studies", "Science"),
    (("grade5_social", "grade6_social", "social"), "Science & Social Studies", "Social Studies"),
    (("subjecttests",), "Science & Social Studies", "Subject Practice & Tests"),

    # Math
    (("math_games/mathfacts/", "factscount", "four_facts", "operationmemory", "operationsgames"), "Math & Numeracy", "Math Facts & Operations"),
    (("multiplication", "multi_", "division", "long_division", "divisibility"), "Math & Numeracy", "Multiplication & Division"),
    (("algebra", "input_output", "input-output", "pedmas", "decimal", "fraction", "target_number"), "Math & Numeracy", "Number Sense & Problem Solving"),
    (("mathbingo", "bingo"), "Math & Numeracy", "Math Games"),
    (("cartesian", "dice_grid", "7dice", "15-tictactoe", "telling_time", "10frames", "magic-square"), "Math & Numeracy", "Number Sense & Problem Solving"),
    (("math_games/",), "Math & Numeracy", "Math Games"),

    # Literacy, language, and reading
    (("acrostic", "haiku", "poem", "raft", "pwim", "fry", "word_scrambler", "wordle", "madlib"), "Literacy & ELA", "Writing & Word Work"),
    (("epub_reader", "reading"), "Literacy & ELA", "Reading Tools"),
    (("wordsearchgenerator", "word_search", "wordsearch"), "Literacy & ELA", "Word Work Generators"),

    # Teacher/classroom tools
    (("teacher_tools/", "attendance", "random_group", "word_cloud", "qr_creator", "dice_roller", "random_card"), "Teacher Tools", "Classroom Utilities"),
    (("clickable_aac", "aac_word_board"), "Teacher Tools", "Accessibility & Communication"),
    (("tabata", "timer_accuracy"), "Teacher Tools", "Timers & Routines"),

    # Art, media, creation
    (("art related/", "comic", "pointillism", "rorschach", "mandala", "image_to_ascii", "ascii_art", "reveal_color"), "Art, Media & Creation", "Art & Image Tools"),
    (("annotator", "blank_comic"), "Art, Media & Creation", "Comic & Annotation Tools"),

    # Music
    (("ear_training/", "ear_training", "chord_ear", "interval", "melody", "mode_recognition", "scale_recognition", "pitch_higher", "note_in_chord"), "Music & Ear Training", "Ear Training"),
    (("guitar", "ukulele", "harmonic", "build_the_chord", "chord_progression", "chord_finder", "scale_mapper"), "Music & Ear Training", "Guitar, Chords & Theory"),
    (("music/", "breathing_voice"), "Music & Ear Training", "Music & Practice Tools"),

    # Arcade/action
    (("arcadegames/", "arcade", "jezzball", "pacman", "ghost", "pong", "snake", "runner", "target_practice", "pool_ball", "drop", "sky_stacker", "antisimon"), "Arcade & Action Games", "Arcade Games"),
    (("tetris_games/", "tetris", "typing_tetris"), "Arcade & Action Games", "Tetris & Falling Blocks"),
    (("arrow_escape", "paint_maze"), "Arcade & Action Games", "Action Challenges"),

    # Strategy/board/logic
    (("cardgames/", "card_games/", "card-games/", "cardgames", "card_games", "card-games", "solitaire"), "Strategy, Board & Logic Games", "Card & Solitaire Games"),
    (("chessgames/", "chess", "knight-tour", "knights-tour"), "Strategy, Board & Logic Games", "Chess & Knight Games"),
    (("connectfour/", "connect4", "connect_4"), "Strategy, Board & Logic Games", "Connect Four Variants"),
    (("strategy_games/", "shikaku", "go_local", "go.html", "hex", "nim", "ataxx", "minesweeper", "dots-and-boxes", "bridgit", "obstruction", "battleship", "checkers", "snakes_and_ladders", "snakes-and-ladders", "sim.html", "hold-the-line", "black-hole", "rabbit_hunt"), "Strategy, Board & Logic Games", "Strategy & Logic Games"),
    (("tictactoegames/", "tic_tac_toe", "tictactoe", "ultimate_tic", "order-and-chaos", "exact-four", "row_call"), "Strategy, Board & Logic Games", "Tic-Tac-Toe Variants"),
    (("maze", "line_draw", "hexa", "sudoku"), "Strategy, Board & Logic Games", "Mazes & Logic Puzzles"),

    # Word, trivia, quizzes, memory
    (("dle_and_thisorthat_games/", "dle", "thisorthat", "truth_or_bologna", "realcity", "citypop", "billboard", "hockey", "soccer", "weightgame", "canprices", "polygon_guess", "numdle", "binarydle"), "Word, Trivia & Quiz Games", "Trivia & Guessing Games"),
    (("wordgames/", "hangman", "scrabble", "boggle", "word-ladder", "word_maker", "unusual_words", "word_memory"), "Word, Trivia & Quiz Games", "Word Games"),
    (("number_memory", "draw_from_memory", "major-system"), "Word, Trivia & Quiz Games", "Memory Games"),
    (("canada_click", "world_click"), "Word, Trivia & Quiz Games", "Geography Games"),
    (("scattergories", "wheel_of_fortune"), "Word, Trivia & Quiz Games", "Party & Word Games"),

    # Fallback broad folders
    (("misc_games/",), "Strategy, Board & Logic Games", "Other Games"),
    (("misc/",), "Teacher Tools", "Miscellaneous Tools"),
]


# ---------------------------------------------------------------------------
# Data structures
# ---------------------------------------------------------------------------

@dataclass
class FileEntry:
    name: str
    rel_path: str
    category: str
    subcategory: str
    icon: str
    mtime: float | None = None


@dataclass
class FolderNode:
    name: str
    rel_path: str
    files: List[Tuple[str, str]] = field(default_factory=list)
    dirs: Dict[str, "FolderNode"] = field(default_factory=dict)


# ---------------------------------------------------------------------------
# Basic helpers
# ---------------------------------------------------------------------------

def esc(s: object) -> str:
    text = "" if s is None else str(s)
    return (
        text.replace("&", "&amp;")
            .replace("<", "&lt;")
            .replace(">", "&gt;")
            .replace('"', "&quot;")
    )


def href_for(rel_path: str) -> str:
    # Preserve folder separators while safely encoding spaces and special characters.
    return quote(rel_path, safe="/")


def normalize_path(s: str) -> str:
    return s.replace("\\", "/").strip("/")


def normalize_ext(ext: str) -> str:
    e = ext.strip()
    if not e:
        return ""
    if not e.startswith("."):
        e = "." + e
    return e.casefold()


def safe_icon(icon: str) -> str:
    # Variation selectors can display oddly in text extractors. Removing them
    # keeps the generated text cleaner while still leaving recognizable symbols.
    return icon.replace("\ufe0f", "")


def slugify(s: str) -> str:
    out = []
    for ch in s.lower():
        if ch.isalnum():
            out.append(ch)
        elif ch in " _-/&":
            out.append("-")
    slug = "".join(out)
    while "--" in slug:
        slug = slug.replace("--", "-")
    return slug.strip("-") or "section"


def display_name(name: str, *, strip_extension: bool = False) -> str:
    raw = Path(name).name
    if strip_extension:
        raw = Path(raw).stem

    raw = raw.replace("_", " ").replace("-", " ")
    raw = re.sub(r"\s+", " ", raw).strip()

    special = {
        "ela": "ELA",
        "aac": "AAC",
        "qr": "QR",
        "epub": "EPUB",
        "pedmas": "PEDMAS",
        "dle": "DLE",
        "nsfw": "NSFW",
        "html": "HTML",
        "cpu": "CPU",
        "sim": "SIM",
        "nim": "NIM",
    }

    words = []
    for word in raw.split(" "):
        low = word.casefold()
        if low in special:
            words.append(special[low])
        elif word.isupper():
            words.append(word)
        else:
            words.append(word[:1].upper() + word[1:])
    return " ".join(words)


def should_exclude_dir(dirname: str, exclude_dirs: Sequence[str]) -> bool:
    d = dirname.casefold()
    return any(d == x.casefold() for x in exclude_dirs)


def should_include_file(
    path: Path,
    root: Path,
    exts_norm: Sequence[str],
    include_root_files: bool,
    hide_root_index_html: bool,
    hide_all_index_html: bool,
    hide_nsfw_anywhere: bool,
) -> bool:
    rel = path.relative_to(root).as_posix()
    lower_rel = rel.casefold()
    lower_fn = path.name.casefold()

    if path.suffix.casefold() not in exts_norm:
        return False
    if not include_root_files and "/" not in rel:
        return False
    if hide_all_index_html and lower_rel.endswith("/index.html"):
        return False
    if hide_root_index_html and lower_rel == "index.html":
        return False
    if hide_nsfw_anywhere and "nsfw" in lower_fn:
        return False
    return True


# ---------------------------------------------------------------------------
# Icons and categorization
# ---------------------------------------------------------------------------

def icon_for(name: str, is_dir: bool) -> str:
    base = Path(name).name
    if base in CUSTOM_ICONS:
        return safe_icon(CUSTOM_ICONS[base])

    low = name.casefold()
    matches = [(key, icon) for key, icon in ICON_RULES if key.casefold() in low]
    if matches:
        matches.sort(key=lambda item: len(item[0]), reverse=True)
        return safe_icon(matches[0][1])

    return DEFAULT_FOLDER_ICON if is_dir else DEFAULT_FILE_ICON


def icon_for_file(rel_path: str, category: str, subcategory: str) -> str:
    """Return a file icon without letting folder names mislabel the file.

    Exact filename overrides and filename keywords still work, but broad folder
    words are ignored for files. If nothing in the filename is clear, fall back
    to the already-decided subcategory/category. This is what keeps an ELA file
    inside a Science or Social folder from displaying a Science/Social icon.
    """
    base = Path(rel_path).name

    if base in CUSTOM_ICONS:
        return safe_icon(CUSTOM_ICONS[base])

    full_low = normalize_path(rel_path).casefold()
    if any(token in full_low for token in ("cardgames", "card_games", "card-games", "solitaire")):
        return safe_icon("🃏")

    low = base.casefold()
    matches = [(key, icon) for key, icon in ICON_RULES if key.casefold() in low]
    if matches:
        matches.sort(key=lambda item: len(item[0]), reverse=True)
        return safe_icon(matches[0][1])

    if subcategory in SUBCATEGORY_ICONS:
        return safe_icon(SUBCATEGORY_ICONS[subcategory])

    return safe_icon(CATEGORY_ICONS.get(category, DEFAULT_FILE_ICON))


def categorize_file(rel_path: str) -> Tuple[str, str]:
    low = normalize_path(rel_path).casefold()
    filename = Path(low).name

    for tokens, category, subcategory in CATEGORY_RULES:
        if any(token.casefold() in low or token.casefold() in filename for token in tokens):
            return category, subcategory

    return "Other / Unsorted", "Other"


def is_educational(entry: FileEntry) -> bool:
    """Decide whether a file belongs in the education-only index.

    The filter is intentionally transparent:
    1. exact filename exclusions always win;
    2. any Tetris variant is excluded;
    3. exact filename inclusions can rescue useful arcade/action tools;
    4. known educational categories are included;
    5. conservative filename keywords catch obvious future classroom files.
    """
    filename = entry.name.casefold()
    rel_path = normalize_path(entry.rel_path).casefold()

    # The education-only index is always school-safe: anything marked NSFW is
    # excluded even when the regular index is generated without --hide-nsfw.
    if "nsfw" in filename or "nsfw" in rel_path:
        return False

    if filename in EDUCATIONAL_EXCLUDE_FILENAMES:
        return False

    if "tetris" in filename or "tetris_games/" in rel_path:
        return False

    if filename in EDUCATIONAL_INCLUDE_FILENAMES:
        return True

    if entry.category in EDUCATIONAL_CATEGORIES:
        return True

    return any(keyword in filename for keyword in EDUCATIONAL_INCLUDE_KEYWORDS)


# ---------------------------------------------------------------------------
# Scanning
# ---------------------------------------------------------------------------

def iter_matching_files(
    root: Path,
    exts: Sequence[str],
    exclude_dirs: Sequence[str],
    include_root_files: bool,
    hide_root_index_html: bool,
    hide_all_index_html: bool,
    hide_nsfw_anywhere: bool,
) -> Iterable[Path]:
    exts_norm = [normalize_ext(e) for e in exts if normalize_ext(e)]
    if not exts_norm:
        exts_norm = [".html"]

    for dirpath, dirnames, filenames in os.walk(root):
        dirnames[:] = [d for d in dirnames if not should_exclude_dir(d, exclude_dirs)]

        for filename in filenames:
            path = Path(dirpath) / filename
            if should_include_file(
                path=path,
                root=root,
                exts_norm=exts_norm,
                include_root_files=include_root_files,
                hide_root_index_html=hide_root_index_html,
                hide_all_index_html=hide_all_index_html,
                hide_nsfw_anywhere=hide_nsfw_anywhere,
            ):
                yield path


def scan_files(
    root: Path,
    exts: Sequence[str],
    exclude_dirs: Sequence[str],
    include_root_files: bool,
    hide_root_index_html: bool,
    hide_all_index_html: bool,
    hide_nsfw_anywhere: bool,
) -> List[FileEntry]:
    entries: List[FileEntry] = []

    for path in iter_matching_files(
        root=root,
        exts=exts,
        exclude_dirs=exclude_dirs,
        include_root_files=include_root_files,
        hide_root_index_html=hide_root_index_html,
        hide_all_index_html=hide_all_index_html,
        hide_nsfw_anywhere=hide_nsfw_anywhere,
    ):
        rel = path.relative_to(root).as_posix()
        try:
            mtime = path.stat().st_mtime
        except OSError:
            mtime = None

        category, subcategory = categorize_file(rel)
        entries.append(
            FileEntry(
                name=Path(rel).name,
                rel_path=rel,
                category=category,
                subcategory=subcategory,
                icon=icon_for_file(rel, category, subcategory),
                mtime=mtime,
            )
        )

    category_rank = {category: index for index, category in enumerate(CATEGORY_ORDER)}
    entries.sort(
        key=lambda item: (
            category_rank.get(item.category, 999),
            item.subcategory.casefold(),
            display_name(item.name, strip_extension=True).casefold(),
        )
    )
    return entries


# ---------------------------------------------------------------------------
# Folder tree, used for optional maintenance view
# ---------------------------------------------------------------------------

def get_or_create_dir(parent: FolderNode, dir_name: str, full_rel: str) -> FolderNode:
    if dir_name not in parent.dirs:
        parent.dirs[dir_name] = FolderNode(name=dir_name, rel_path=full_rel)
    return parent.dirs[dir_name]


def add_file_to_tree(tree: FolderNode, rel_file_path: str) -> None:
    parts = [p for p in normalize_path(rel_file_path).split("/") if p]
    filename = parts.pop()
    node = tree
    accum = ""
    for dirname in parts:
        accum = f"{accum}/{dirname}" if accum else dirname
        node = get_or_create_dir(node, dirname, accum)
    node.files.append((filename, rel_file_path))


def build_folder_tree(entries: Sequence[FileEntry]) -> FolderNode:
    tree = FolderNode(name="", rel_path="")
    for entry in entries:
        add_file_to_tree(tree, entry.rel_path)
    prune_empty_dirs(tree)
    return tree


def count_in_subtree(node: FolderNode) -> int:
    total = len(node.files)
    for child in node.dirs.values():
        total += count_in_subtree(child)
    return total


def prune_empty_dirs(node: FolderNode) -> None:
    for name in list(node.dirs.keys()):
        child = node.dirs[name]
        prune_empty_dirs(child)
        if count_in_subtree(child) == 0:
            del node.dirs[name]


# ---------------------------------------------------------------------------
# Recent files
# ---------------------------------------------------------------------------

def absolute_day_label(mtime: float) -> str:
    return datetime.fromtimestamp(mtime).strftime("%B %d, %Y")


def changed_date_iso(mtime: float) -> str:
    return datetime.fromtimestamp(mtime).date().isoformat()


def recent_entries(entries: Sequence[FileEntry], days: int) -> List[FileEntry]:
    cutoff = datetime.now().timestamp() - (days * 24 * 60 * 60)
    recent = [entry for entry in entries if entry.mtime is not None and entry.mtime >= cutoff]
    recent.sort(key=lambda item: item.mtime or 0, reverse=True)
    return recent


# ---------------------------------------------------------------------------
# Rendering
# ---------------------------------------------------------------------------

def render_app_item(entry: FileEntry, recent_paths: set[str], show_path: bool = False) -> str:
    badge = '<span class="new-badge">NEW</span>' if entry.rel_path in recent_paths else ""
    path_note = f'<span class="path-note">{esc(entry.rel_path)}</span>' if show_path else ""
    title = display_name(entry.name, strip_extension=True)
    search_text = f"{title} {entry.name} {entry.rel_path} {entry.category} {entry.subcategory}"
    return (
        f'<li class="app-item" data-path="{esc(entry.rel_path)}" data-search="{esc(search_text.casefold())}">'
        f'<a href="{esc(href_for(entry.rel_path))}" target="_blank" rel="noopener noreferrer">'
        f'<span class="icon">{esc(entry.icon)}</span>'
        f'<span class="app-title">{esc(title)}</span>'
        f'</a>'
        f'{badge}{path_note}'
        f'</li>'
    )


def render_recent_section(recent: Sequence[FileEntry], recent_days: int) -> str:
    if not recent:
        return (
            '<section class="category-block recent-section searchable-category" id="recently-changed">'
            '<div class="category-heading"><span class="icon">🕒</span><span>Recently Changed</span></div>'
            f'<p class="recent-empty">No files were added or changed in the last {recent_days} days.</p>'
            '</section>'
        )

    items = []
    for entry in recent:
        changed_abs = absolute_day_label(entry.mtime or 0)
        changed_iso = changed_date_iso(entry.mtime or 0)
        title = display_name(entry.name, strip_extension=True)
        search_text = f"{title} {entry.name} {entry.rel_path} {entry.category} {entry.subcategory}"
        items.append(
            f'<li class="app-item recent-item" data-path="{esc(entry.rel_path)}" data-search="{esc(search_text.casefold())}">'
            f'<a href="{esc(href_for(entry.rel_path))}" target="_blank" rel="noopener noreferrer">'
            f'<span class="icon">{esc(entry.icon)}</span><span class="app-title">{esc(title)}</span></a>'
            f'<span class="changed-note" data-changed-date="{esc(changed_iso)}" title="Changed {esc(changed_abs)}">{esc(changed_abs)}</span>'
            '</li>'
        )

    return (
        '<section class="category-block recent-section searchable-category" id="recently-changed">'
        '<div class="category-heading"><span class="icon">🕒</span><span>Recently Changed</span></div>'
        '<ul class="app-list recent-list">'
        + "\n".join(items)
        + '</ul></section>'
    )


def group_entries(entries: Sequence[FileEntry]) -> Dict[str, Dict[str, List[FileEntry]]]:
    grouped: Dict[str, Dict[str, List[FileEntry]]] = {category: {} for category in CATEGORY_ORDER}

    for entry in entries:
        grouped.setdefault(entry.category, {})
        grouped[entry.category].setdefault(entry.subcategory, []).append(entry)

    for subgroups in grouped.values():
        for items in subgroups.values():
            items.sort(key=lambda item: display_name(item.name, strip_extension=True).casefold())

    return grouped


def render_sidebar(entries: Sequence[FileEntry], recent_count: int, include_folder_view: bool) -> str:
    counts: Dict[str, int] = {category: 0 for category in CATEGORY_ORDER}
    for entry in entries:
        counts[entry.category] = counts.get(entry.category, 0) + 1

    links: List[str] = []

    for category in CATEGORY_ORDER:
        count = counts.get(category, 0)
        if count <= 0:
            continue
        links.append(
            f'<li><a href="#{esc(slugify(category))}"><span class="icon">{esc(CATEGORY_ICONS.get(category, "📁"))}</span>'
            f'{esc(category)} <span class="muted">({count})</span></a></li>'
        )

    links.append(
        f'<li><a href="#recently-changed"><span class="icon">🕒</span>'
        f'Recently Changed <span class="muted">({recent_count})</span></a></li>'
    )

    if include_folder_view:
        links.append('<li><a href="#folder-view"><span class="icon">🗂</span>Folder View</a></li>')

    return '<ul class="sidebar-list">' + "\n".join(links) + '</ul>'


def render_category_sections(entries: Sequence[FileEntry], recent_paths: set[str]) -> str:
    grouped = group_entries(entries)
    sections: List[str] = []

    for category in CATEGORY_ORDER:
        subgroups = grouped.get(category, {})
        if not subgroups:
            continue

        category_count = sum(len(items) for items in subgroups.values())
        category_icon = CATEGORY_ICONS.get(category, "📁")
        subcategory_html: List[str] = []

        for subcategory in sorted(subgroups.keys(), key=lambda s: s.casefold()):
            items = subgroups[subcategory]
            item_html = "\n".join(render_app_item(entry, recent_paths) for entry in items)
            subcategory_html.append(
                f'<section class="subcategory-block" data-subcategory="{esc(subcategory.casefold())}">'
                f'<h3>{esc(subcategory)} <span class="muted">({len(items)})</span></h3>'
                f'<ul class="app-list">{item_html}</ul>'
                f'</section>'
            )

        sections.append(
            f'<section class="category-block searchable-category" id="{esc(slugify(category))}">'
            f'<div class="category-heading"><span class="icon">{esc(category_icon)}</span>'
            f'<span>{esc(category)}</span><span class="muted">({category_count})</span></div>'
            + "\n".join(subcategory_html)
            + '</section>'
        )

    return "\n".join(sections)


def render_folder_files(files: List[Tuple[str, str]], recent_paths: set[str]) -> str:
    files_sorted = sorted(files, key=lambda item: item[0].casefold())
    items = []
    for name, relpath in files_sorted:
        category, subcategory = categorize_file(relpath)
        entry = FileEntry(
            name=name,
            rel_path=relpath,
            category=category,
            subcategory=subcategory,
            icon=icon_for_file(relpath, category, subcategory),
        )
        items.append(render_app_item(entry, recent_paths, show_path=False))
    return '<ul class="app-list folder-list">' + "\n".join(items) + '</ul>'


def render_folder_dir(node: FolderNode, recent_paths: set[str], open_by_default: bool = False) -> str:
    children: List[str] = []
    for dirname in sorted(node.dirs.keys(), key=lambda s: s.casefold()):
        children.append(render_folder_dir(node.dirs[dirname], recent_paths, open_by_default=False))

    files_html = render_folder_files(node.files, recent_paths) if node.files else ""
    nested_html = "\n".join(children + ([files_html] if files_html else []))
    open_attr = " open" if open_by_default else ""
    count = count_in_subtree(node)
    icon = icon_for(node.name, True)

    label = display_name(node.name)
    return (
        f'<details class="dir-block"{open_attr}>'
        f'<summary><span class="icon">{esc(icon)}</span>{esc(label)} <span class="muted">({count})</span></summary>'
        f'<div class="nested">{nested_html}</div>'
        f'</details>'
    )


def render_folder_view(entries: Sequence[FileEntry], recent_paths: set[str], include_folder_view: bool) -> str:
    if not include_folder_view:
        return ""

    tree = build_folder_tree(entries)
    folders = []
    for dirname in sorted(tree.dirs.keys(), key=lambda s: s.casefold()):
        folders.append(render_folder_dir(tree.dirs[dirname], recent_paths, open_by_default=False))

    return (
        '<section class="category-block folder-view-section" id="folder-view">'
        '<div class="category-heading"><span class="icon">🗂</span><span>Repository Folder View</span></div>'
        '<p class="section-note">This maintenance view keeps the original folder structure, but the main list above is grouped by app purpose.</p>'
        + "\n".join(folders)
        + '</section>'
    )


def render_page(
    entries: Sequence[FileEntry],
    recent_days: int,
    include_folder_view: bool,
    title: str = "jwesters website",
    intro: str | None = None,
) -> str:
    now = datetime.now()
    formatted = now.strftime("%B %d, %Y at %I:%M %p")
    intro_text = intro or "Apps are grouped by purpose first, with the original folder view kept for maintenance."
    total_items = len(entries)
    status = "No matching files found." if total_items == 0 else f"{total_items} files indexed"

    recent = recent_entries(entries, recent_days)
    recent_paths = {entry.rel_path for entry in recent}

    sidebar_html = render_sidebar(entries, recent_count=len(recent), include_folder_view=include_folder_view)
    recent_html = render_recent_section(recent, recent_days)
    category_html = render_category_sections(entries, recent_paths)
    folder_html = render_folder_view(entries, recent_paths, include_folder_view)

    return f'''<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>{esc(title)}</title>
<style>
  :root {{
    color-scheme: light;
    --bg:#f4f6f8;
    --panel:#ffffff;
    --panel-soft:#fafbfc;
    --border:#e4e8ee;
    --text:#1f2937;
    --muted:#667085;
    --link:#0b66d0;
    --accent:#2563eb;
    --accent-soft:#eef5ff;
    --shadow:0 8px 28px rgba(15, 23, 42, .08);
    --radius:18px;
  }}
  * {{ box-sizing:border-box; }}
  html {{ scroll-behavior:smooth; }}
  body {{ margin:0; font-family:Arial, sans-serif; color:var(--text); background:var(--bg); }}
  a {{ color:var(--link); text-decoration:none; }}
  a:hover {{ text-decoration:underline; }}
  .page {{ max-width:1500px; margin:0 auto; padding:24px; }}
  .hero {{
    background:linear-gradient(135deg, #ffffff, #f8fbff);
    border:1px solid var(--border);
    border-radius:24px;
    box-shadow:var(--shadow);
    padding:24px;
    margin-bottom:20px;
  }}
  .hero h1 {{ margin:0 0 8px; font-size:clamp(26px, 3vw, 38px); letter-spacing:-.03em; }}
  .hero p {{ margin:0; color:var(--muted); line-height:1.5; }}
  .pill-row {{ display:flex; flex-wrap:wrap; gap:8px; margin-top:14px; }}
  .pill {{
    display:inline-flex; align-items:center; gap:6px;
    padding:6px 10px; border:1px solid var(--border); border-radius:999px;
    background:#fff; color:var(--muted); font-size:.92rem;
  }}
  .layout {{
    display:grid;
    grid-template-columns:300px minmax(0, 1fr);
    grid-template-areas:"sidebar search" "sidebar content";
    gap:20px;
    align-items:start;
  }}
  .layout-search {{ grid-area:search; }}
  .sidebar {{
    grid-area:sidebar;
    position:sticky;
    top:18px;
    background:var(--panel);
    border:1px solid var(--border);
    border-radius:var(--radius);
    box-shadow:var(--shadow);
    padding:18px;
  }}
  .sidebar h2 {{ margin:0 0 14px; font-size:18px; }}
  .sidebar-list {{ list-style:none; margin:0; padding:0; display:flex; flex-direction:column; gap:5px; }}
  .sidebar-list a {{ display:block; padding:8px 10px; border-radius:12px; color:var(--text); }}
  .sidebar-list a:hover {{ background:var(--accent-soft); color:var(--link); text-decoration:none; }}
  .content {{ grid-area:content; display:flex; flex-direction:column; gap:18px; }}
  .category-block {{
    background:var(--panel);
    border:1px solid var(--border);
    border-radius:var(--radius);
    box-shadow:var(--shadow);
    padding:18px;
  }}
  .category-heading {{
    display:flex;
    align-items:center;
    gap:10px;
    font-size:21px;
    font-weight:800;
    margin-bottom:14px;
    letter-spacing:-.02em;
  }}
  .subcategory-block {{
    border:1px solid var(--border);
    border-radius:16px;
    background:var(--panel-soft);
    padding:14px;
  }}
  .subcategory-block + .subcategory-block {{ margin-top:14px; }}
  .subcategory-block h3 {{ margin:0 0 10px; font-size:16px; }}
  .app-list {{ list-style:none; padding:0; margin:0; display:flex; flex-direction:column; gap:8px; }}
  .app-item {{
    min-width:0;
    padding:10px 12px;
    border-radius:12px;
    background:#fff;
    border:1px solid rgba(228,232,238,.75);
  }}
  .app-item:hover {{ border-color:#cbd8e8; box-shadow:0 4px 16px rgba(15,23,42,.06); }}
  .app-item a {{ display:inline-flex; align-items:center; gap:4px; font-weight:700; color:var(--text); }}
  .app-item a:hover {{ color:var(--link); text-decoration:none; }}
  .app-title {{ overflow-wrap:anywhere; }}
  .path-note {{ display:block; margin-top:4px; color:var(--muted); font-size:.82rem; overflow-wrap:anywhere; }}
  .changed-note {{ display:inline-block; margin-left:8px; color:var(--muted); font-size:.88rem; }}
  .muted {{ color:var(--muted); font-weight:400; margin-left:4px; font-size:.92em; }}
  .icon {{ display:inline-block; width:24px; text-align:center; margin-right:2px; flex:0 0 auto; }}
  .new-badge {{
    display:inline-block;
    margin-left:8px;
    padding:2px 8px;
    border-radius:999px;
    background:#ffe7a8;
    color:#7a5300;
    font-size:.75rem;
    font-weight:800;
    vertical-align:middle;
  }}
  .recent-empty, .section-note {{ margin:0 0 12px; color:var(--muted); line-height:1.45; }}
  .search-panel {{
    background:var(--panel);
    border:1px solid var(--border);
    border-radius:var(--radius);
    box-shadow:var(--shadow);
    padding:16px 18px;
  }}
  .search-label {{ display:block; font-size:14px; font-weight:800; margin-bottom:8px; color:var(--muted); }}
  .search-input {{
    width:100%;
    padding:12px 14px;
    border:1px solid var(--border);
    border-radius:12px;
    font-size:16px;
    background:#fff;
    color:var(--text);
  }}
  .search-input:focus {{
    outline:none;
    border-color:#b9d4f5;
    box-shadow:0 0 0 4px rgba(11, 102, 208, .10);
  }}
  .search-help {{ margin-top:8px; color:var(--muted); font-size:.92em; }}
  .search-empty {{
    display:none;
    background:var(--panel);
    border:1px solid var(--border);
    border-radius:var(--radius);
    box-shadow:var(--shadow);
    padding:18px;
    color:var(--muted);
  }}
  details {{
    margin:10px 0;
    border:1px solid var(--border);
    border-radius:14px;
    background:var(--panel-soft);
    overflow:hidden;
  }}
  summary {{
    cursor:pointer;
    padding:12px 14px;
    font-weight:800;
    user-select:none;
    list-style:none;
  }}
  summary::-webkit-details-marker {{ display:none; }}
  summary::before {{ content:"▸"; display:inline-block; width:18px; color:#666; }}
  details[open] summary::before {{ content:"▾"; }}
  .nested {{ padding:0 12px 12px 18px; }}
  .folder-list {{ padding:10px 0; }}
  .footer {{ margin-top:18px; color:var(--muted); font-size:.95em; }}
  .last-updated {{ margin-bottom:6px; }}
  .footer a {{ font-weight:800; }}
  @media (max-width: 980px) {{
    .page {{ padding:14px; }}
    .layout {{
      grid-template-columns:1fr;
      grid-template-areas:"search" "sidebar" "content";
    }}
    .sidebar {{ position:static; }}
  }}
</style>
</head>
<body>
  <div class="page">
    <header class="hero">
      <h1>{esc(title)}</h1>
      <p>{esc(status)} · {esc(intro_text)}<br>
      Generated: <strong>{esc(formatted)}</strong></p>
    </header>

    <div class="layout">
      <section class="search-panel layout-search">
        <label class="search-label" for="site-search">Search apps</label>
        <input id="site-search" class="search-input" type="search" placeholder="Type a file, topic, folder, or category..." autocomplete="off" />
        <div class="search-help">Search updates the app list, sidebar, recent files, and folder view instantly.</div>
      </section>

      <aside class="sidebar">
        <h2>Browse</h2>
        {sidebar_html}
      </aside>

      <main class="content">
        <div id="search-empty" class="search-empty">No matching apps found.</div>
        {category_html}
        {folder_html}
        {recent_html}
        <div class="footer">
          <div class="last-updated">Last updated: <strong>{esc(formatted)}</strong></div>
          <a href="https://github.com/jwesters/website">jwesters github repo</a>
        </div>
      </main>
    </div>
  </div>

<script>
(function () {{
  const input = document.getElementById('site-search');
  const empty = document.getElementById('search-empty');
  if (!input) return;

  function norm(s) {{
    return (s || '').toLowerCase().trim();
  }}

  function isVisible(el) {{
    return !!el && el.style.display !== 'none';
  }}

  function formatLongDate(date) {{
    return date.toLocaleDateString(undefined, {{ year: 'numeric', month: 'long', day: 'numeric' }});
  }}

  function updateChangedNotes() {{
    const today = new Date();
    const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const oneDay = 24 * 60 * 60 * 1000;

    Array.from(document.querySelectorAll('.changed-note[data-changed-date]')).forEach((note) => {{
      const iso = note.dataset.changedDate || '';
      const parts = iso.split('-').map(Number);
      if (parts.length !== 3 || parts.some(Number.isNaN)) return;

      const changed = new Date(parts[0], parts[1] - 1, parts[2]);
      const diffDays = Math.floor((todayOnly - changed) / oneDay);
      let label = 'Today';
      if (diffDays === 1) label = 'Yesterday';
      else if (diffDays > 1) label = `${{diffDays}} days ago`;

      note.textContent = label;
      note.title = `Changed ${{formatLongDate(changed)}}`;
    }});
  }}

  function applySearch() {{
    const q = norm(input.value);
    const appItems = Array.from(document.querySelectorAll('.app-item'));
    const visiblePaths = new Set();

    appItems.forEach((item) => {{
      const haystack = item.dataset.search || norm(item.textContent);
      const match = !q || haystack.includes(q);
      item.style.display = match ? '' : 'none';
      if (match && item.dataset.path) visiblePaths.add(item.dataset.path);
    }});

    Array.from(document.querySelectorAll('.subcategory-block')).forEach((block) => {{
      const show = !!block.querySelector('.app-item:not([style*="display: none"])');
      block.style.display = show ? '' : 'none';
    }});

    Array.from(document.querySelectorAll('.searchable-category')).forEach((section) => {{
      const show = !!section.querySelector('.app-item:not([style*="display: none"]), .subcategory-block:not([style*="display: none"])');
      section.style.display = show ? '' : 'none';
    }});

    Array.from(document.querySelectorAll('details.dir-block')).reverse().forEach((details) => {{
      const show = !q ||
        !!details.querySelector('.app-item:not([style*="display: none"])') ||
        Array.from(details.querySelectorAll(':scope > .nested > details.dir-block')).some(isVisible);
      details.style.display = show ? '' : 'none';
      if (q && show) details.open = true;
    }});

    const folderView = document.querySelector('.folder-view-section');
    if (folderView) {{
      const show = !q || !!folderView.querySelector('.app-item:not([style*="display: none"]), details.dir-block:not([style*="display: none"])');
      folderView.style.display = show ? '' : 'none';
    }}

    Array.from(document.querySelectorAll('.sidebar-list li')).forEach((li) => {{
      const href = li.querySelector('a')?.getAttribute('href');
      if (!href || !href.startsWith('#')) {{
        li.style.display = '';
        return;
      }}
      const target = document.querySelector(href);
      li.style.display = (!q || isVisible(target)) ? '' : 'none';
    }});

    empty.style.display = q && visiblePaths.size === 0 ? 'block' : 'none';
  }}

  updateChangedNotes();
  input.addEventListener('input', applySearch);
}})();
</script>
</body>
</html>
'''


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------

def main() -> int:
    parser = argparse.ArgumentParser(description="Generate a logically grouped static website index.")
    parser.add_argument("--root", default=".", help="Root folder to scan. Default: current folder.")
    parser.add_argument("--out", default="indexGen.html", help="Output HTML filename. Default: indexGen.html.")
    parser.add_argument("--ext", action="append", default=[], help="File extension to include. Repeatable. Default: .html")
    parser.add_argument("--exclude-dir", action="append", default=[".git", "node_modules"], help="Directory name to skip. Repeatable.")
    parser.add_argument("--include-root-files", action="store_true", help="Include files directly in the root folder. Default: off.")
    parser.add_argument("--hide-root-index-html", action="store_true", help='Hide only root "index.html". Root files are excluded unless --include-root-files is used.')
    parser.add_argument("--hide-all-index-html", action="store_true", help='Hide every ".../index.html".')
    parser.add_argument("--hide-nsfw", action="store_true", help='Hide files where "nsfw" appears anywhere in the filename.')
    parser.add_argument("--recent-days", type=int, default=7, help="How many days count as recent. Default: 7.")
    parser.add_argument("--no-folder-view", action="store_true", help="Hide the original repository folder view at the bottom.")
    parser.add_argument("--edu-out", default="indexEDU.html", help="Education-only output HTML filename. Default: indexEDU.html.")
    parser.add_argument("--no-edu-index", action="store_true", help="Do not write the education-only indexEDU.html file.")

    args = parser.parse_args()

    root = Path(args.root).expanduser().resolve()
    if not root.exists() or not root.is_dir():
        raise SystemExit(f"Root folder does not exist or is not a directory: {root}")

    entries = scan_files(
        root=root,
        exts=args.ext,
        exclude_dirs=args.exclude_dir,
        include_root_files=args.include_root_files,
        hide_root_index_html=args.hide_root_index_html,
        hide_all_index_html=args.hide_all_index_html,
        hide_nsfw_anywhere=args.hide_nsfw,
    )

    recent_days = max(1, args.recent_days)
    include_folder_view = not args.no_folder_view

    html_text = render_page(
        entries=entries,
        recent_days=recent_days,
        include_folder_view=include_folder_view,
        title="jwesters website",
    )

    out_path = root / args.out
    out_path.write_text(html_text, encoding="utf-8")
    print(f"Wrote: {out_path}")
    print(f"Indexed: {len(entries)} files")

    if not args.no_edu_index:
        edu_entries = [entry for entry in entries if is_educational(entry)]
        edu_html_text = render_page(
            entries=edu_entries,
            recent_days=recent_days,
            include_folder_view=include_folder_view,
            title="jwesters educational links",
            intro="Only links classified as educational or classroom-useful are shown here.",
        )
        edu_out_path = root / args.edu_out
        edu_out_path.write_text(edu_html_text, encoding="utf-8")
        print(f"Wrote: {edu_out_path}")
        print(f"Indexed EDU: {len(edu_entries)} files")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())

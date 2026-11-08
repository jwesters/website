#!/usr/bin/env python3
'''
make_indexGen.py

Generate a polished static index page for jwesters.github.io/website or a similar folder tree.

What this version does differently:
- Groups apps by purpose, using the reorganized repository folders as the primary source of truth.
- Keeps a Recent Changes section at the bottom.
- Keeps an optional repository-folder view at the bottom for maintenance.
- Excludes root-level files by default, matching the previous generator.
- Always excludes source.html files from generated indexes.
- Labels index.html links with the page's HTML title instead of "Index".
- Can hide filenames containing "nsfw" with --hide-nsfw.
- Also writes an education-only indexEDU.html by default.
- Always keeps NSFW filenames/paths out of indexEDU.html.
- Uses only the Python standard library (Git is optional for --recent-source git).
- Supports index_catalog.json for exact app overrides and searchable secondary tags.
- Writes index_audit.json with duplicate-title, classification, and folder checks.
- Classification works with the folder reorganization completed in November 2026.
- Can build audit-only: python make_indexGen.py --audit-only
- Can use committed timestamps: python make_indexGen.py --recent-source git

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
import collections
import hashlib
import json
import subprocess
import os
import re
import time
from functools import lru_cache
from dataclasses import dataclass, field
from typing import Any
from datetime import datetime
from html.parser import HTMLParser
from pathlib import Path
from typing import Dict, Iterable, List, Sequence, Tuple
from urllib.parse import quote


# ---------------------------------------------------------------------------
# Icons
# ---------------------------------------------------------------------------

# Exact file/folder icon overrides. These are used before keyword rules.
CUSTOM_ICONS = {'BillboardNumberOne.html': '🎵',
 'Yahtzee.html': '🎲',
 'yahtzee.html': '🎲',
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
 'ELA6_practice_site.html': '📚',
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
 'ELA': '📚',
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
 'Canada_Click_Challenge.html': '🇨🇦',
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
 'Grade5_ELA.html': '📚',
 'Grade6_ELA.html': '📚',
 'Grade6_Math.html': '➗',
 'Grade6_Science.html': '🔬',
 'Grade6_Social.html': '🌎',
 'Creative_Tools': '🎨',
 'Learning_Reference': '📘',
 'Sports_Fitness': '🏃',
 'Utilities': '🛠️',
 'Generators': '⚙️',
 'Simulations': '🧪',
 'Accessibility_Communication': '🗣️',
 'Classroom_Utilities': '🍎',
 'Documents_Files': '📄',
 'Web_Sharing': '🔗',
 'Reading': '📖',
 'Wellness': '🫁',
 'Audio': '🔊',
 'Basketball': '🏀',
 'Fitness_Tools': '🏃',
 'Driver_Education': '🚗',
 'MemoryGames': '🧠',
 'Firework_Chemistry_Lab.html': '🎆',
 'Nuclear_Consequences_Educational_Map.html': '☢️',
 'Link_Card.html': '🔗',
 'Bingo_Caller.html': '🎟️'}

CUSTOM_ICONS_CASEFOLD = {name.casefold(): symbol for name, symbol in CUSTOM_ICONS.items()}

# Keyword rules. Longest keyword match wins.
ICON_RULES = [('canadian', '🇨🇦'),
 ('canada', '🇨🇦'),
 ('yahtzee', '🎲'),
 ('multiplication', '✖️'),
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
 ('ela', '📚'),
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
 ('kolumn', '🧱'),
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

# Acronyms that should be kept together when turning filenames into titles.
# This prevents names such as "toJPEGconverter.html" from becoming "To JPE Gconverter".
ACRONYMS = {
    "AAC", "ASCII", "AVIF", "CPU", "DLE", "ELA", "EPUB", "HTML",
    "JPEG", "JPG", "JTIF", "NIM", "NSFW", "PDF", "PEDMAS", "PNG",
    "QR", "SIM", "WEBP", "WTW",
}
ACRONYM_LOOKUP = {acro.casefold(): acro for acro in ACRONYMS}

# Exact display-name overrides for filenames whose intended title cannot be
# inferred cleanly from underscores/camel case alone.
DISPLAY_NAME_OVERRIDES = {
    "ultimate_tic_tac_toe_4x4_3inarow.html": "Ultimate Tic Tac Toe 4 X 4 3 In A Row",
}
ACRONYM_PATTERN = re.compile("|".join(re.escape(acro) for acro in sorted(ACRONYMS, key=len, reverse=True)))


# ---------------------------------------------------------------------------
# Logical category rules
# ---------------------------------------------------------------------------

CATEGORY_ORDER = [
    "Math & Numeracy",
    "Literacy & ELA",
    "Science & Social Studies",
    "Teacher Tools",
    "Learning & Reference",
    "Sports & Fitness",
    "Utilities & Tools",
    "Art, Media & Creation",
    "Music & Ear Training",
    "Arcade & Action Games",
    "Strategy, Board & Logic Games",
    "Card & Table Games",
    "Word, Trivia & Quiz Games",
    "Other / Unsorted",
]

CATEGORY_ICONS = {
    "Math & Numeracy": "➗",
    "Literacy & ELA": "📚",
    "Science & Social Studies": "🌎",
    "Teacher Tools": "🍎",
    "Learning & Reference": "📘",
    "Sports & Fitness": "🏃",
    "Utilities & Tools": "🛠️",
    "Art, Media & Creation": "🎨",
    "Music & Ear Training": "🎵",
    "Arcade & Action Games": "🕹",
    "Strategy, Board & Logic Games": "♟",
    "Card & Table Games": "🃏",
    "Word, Trivia & Quiz Games": "🔤",
    "Other / Unsorted": "📁",
}

# Subcategory icons are used as a safe fallback when a filename does not have
# a clear icon match. This prevents a file from inheriting the wrong icon just
# because it lives inside a broad folder.
SUBCATEGORY_ICONS = {
    "ELA Practice & Spelling": "📚",
    "Writing & Word Work": "✍️",
    "Typing & Keyboarding": "⌨️",
    "Reading Tools": "📖",
    "Word Work Generators": "🔎",
    "Math Practice & Assessments": "➗",
    "Math Facts & Operations": "⏱️",
    "Multiplication & Division": "✖️",
    "Number Sense & Problem Solving": "🔢",
    "Math Games": "🎲",
    "Science": "🔬",
    "Science Simulations & Labs": "🧪",
    "Social Studies": "🌎",
    "Subject Practice & Tests": "📝",
    "Classroom Utilities": "🍎",
    "Accessibility & Communication": "🗣️",
    "Timers & Routines": "⏱️",
    "Driver Education": "🚗",
    "Basketball": "🏀",
    "Fitness Tools": "🏃",
    "Audio Tools": "🔊",
    "Document & File Tools": "📄",
    "General Utilities": "🛠️",
    "Reading Utilities": "📖",
    "Wellness Tools": "🫁",
    "Web & Sharing Tools": "🔗",
    "Art & Image Tools": "🎨",
    "Comic & Annotation Tools": "💬",
    "Creative Generators": "⚙️",
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
    # Purpose-first subcategories. Physical repository folders are unchanged.
    "Curriculum & Grade-Level Practice": "📘",
    "Concept Explorers & Lessons": "🧭",
    "Skill Practice": "✏️",
    "Test Preparation": "📝",
    "Math Generators": "📐",
    "Creative Writing & Prompts": "✍️",
    "Vocabulary & Spelling": "🔤",
    "ELA Practice": "📚",
    "Science Lessons": "🔬",
    "Classroom Management": "🍎",
    "Printable Generators": "🖨️",
    "Instructional Resources": "📋",
    "Game Rules & Tutorials": "📖",
    "General Reference": "📘",
    "Simulation & Sandbox Games": "🐠",
    "Sports Instruction": "🏀",
    "Game Creation": "🕹️",
    "Music Theory & Instruments": "🎹",
    "MIDI & Music Creation": "🎼",
    "Sound Generation": "🎧",
    "Classic Arcade": "🕹️",
    "Platform & Runner Games": "🏃",
    "Physics & Skill Games": "🎯",
    "Sports Games": "🏌️",
    "Abstract Strategy Games": "♟️",
    "Classic Board & Dice Games": "🎲",
    "Logic & Number Puzzles": "🧩",
    "Tic-Tac-Toe & Connect Four": "❌",
    "Casino Games": "🎰",
}

# ---------------------------------------------------------------------------
# Purpose-first classification overrides
# ---------------------------------------------------------------------------
# A file's purpose wins over incidental words in its parent folder or name.
# Use exact filenames only for distinct apps; use directory prefixes for groups.
# The old keyword rules below remain as a fallback for unrecognized paths.
# All matching is case-insensitive. Neither URLs nor physical files are moved.

EXACT_APP_CATEGORIES: Dict[str, Tuple[str, str]] = {
    # Writing, word work, and literacy.
    "consider_this_writing_prompts.html": ("Literacy & ELA", "Creative Writing & Prompts"),
    "acrostic-poem-builder.html": ("Literacy & ELA", "Creative Writing & Prompts"),
    "haiku-checker.html": ("Literacy & ELA", "Creative Writing & Prompts"),
    "raft_randomizer.html": ("Literacy & ELA", "Creative Writing & Prompts"),
    "madlib_story_maker.html": ("Literacy & ELA", "Creative Writing & Prompts"),
    "create_a_wordle.html": ("Literacy & ELA", "Word Work Generators"),
    "word_scrambler_maker.html": ("Literacy & ELA", "Word Work Generators"),
    "pwim_shareable_link_annotator.html": ("Literacy & ELA", "Word Work Generators"),
    "fry-speak-check-300.html": ("Literacy & ELA", "Vocabulary & Spelling"),
    "spelling-test-audio.html": ("Literacy & ELA", "Vocabulary & Spelling"),
    "wtw_analyzer.html": ("Literacy & ELA", "Vocabulary & Spelling"),
    "typing_test.html": ("Literacy & ELA", "Typing & Keyboarding"),
    "typing-test.html": ("Literacy & ELA", "Typing & Keyboarding"),

    # Curriculum, math games, exam preparation, and teaching materials.
    "grade_9_math_pat_practice_part_a_no_calculator.html": ("Math & Numeracy", "Test Preparation"),
    "grade_9_math_pat_practice_part_b_calculator_allowed.html": ("Math & Numeracy", "Test Preparation"),
    "gr8_sps-eics_questions.html": ("Math & Numeracy", "Test Preparation"),
    "gr9_sps-eics_questions.html": ("Math & Numeracy", "Test Preparation"),
    "mathpursuit_grade7_5ins.html": ("Math & Numeracy", "Math Games"),
    "mathpursuit_grade8_5ins.html": ("Math & Numeracy", "Math Games"),
    "mathpursuit_grade9_5ins.html": ("Math & Numeracy", "Math Games"),
    "alberta_math_review.html": ("Math & Numeracy", "Math Generators"),
    "math_questions_generator.html": ("Math & Numeracy", "Math Generators"),
    "magic-square-generator.html": ("Math & Numeracy", "Math Generators"),
    "exponent_explorer.html": ("Math & Numeracy", "Concept Explorers & Lessons"),
    "fraction_explorer.html": ("Math & Numeracy", "Concept Explorers & Lessons"),
    "ratio_explorer.html": ("Math & Numeracy", "Concept Explorers & Lessons"),
    "probability_explorer.html": ("Math & Numeracy", "Concept Explorers & Lessons"),
    "mental_math_academy.html": ("Math & Numeracy", "Concept Explorers & Lessons"),
    "prime_numbers.html": ("Math & Numeracy", "Concept Explorers & Lessons"),
    "rational_numbers_explorer.html": ("Math & Numeracy", "Concept Explorers & Lessons"),
    "pedmas_explorer.html": ("Math & Numeracy", "Concept Explorers & Lessons"),
    "bedmas_explorer.html": ("Math & Numeracy", "Concept Explorers & Lessons"),
    "bedmas_and_powers_explorer.html": ("Math & Numeracy", "Concept Explorers & Lessons"),
    "equivalent_fractions_practice.html": ("Math & Numeracy", "Skill Practice"),
    "fraction_conversion_practice.html": ("Math & Numeracy", "Skill Practice"),
    "integer_practice.html": ("Math & Numeracy", "Skill Practice"),
    "long_division_practice.html": ("Math & Numeracy", "Skill Practice"),
    "order_of_operations.html": ("Math & Numeracy", "Skill Practice"),
    "input_output_machine_numbers.html": ("Math & Numeracy", "Skill Practice"),
    "telling_time.html": ("Math & Numeracy", "Skill Practice"),
    "divisibility-rules-2-10.html": ("Math & Numeracy", "Skill Practice"),
    "15-tictactoe.html": ("Math & Numeracy", "Math Games"),
    "7dice.html": ("Math & Numeracy", "Math Games"),
    "algebra_equation_game.html": ("Math & Numeracy", "Math Games"),
    "cartesiantictactoe.html": ("Math & Numeracy", "Math Games"),
    "decimal_guess_number.html": ("Math & Numeracy", "Math Games"),
    "dice_grid_game.html": ("Math & Numeracy", "Math Games"),
    "fraction_archery.html": ("Math & Numeracy", "Math Games"),
    "pedmasgame.html": ("Math & Numeracy", "Math Games"),
    "target_number_golf.html": ("Math & Numeracy", "Math Games"),
    "input_output_machine.html": ("Math & Numeracy", "Number Sense & Problem Solving"),
    "10frames.html": ("Math & Numeracy", "Skill Practice"),

    # The source files stay in their existing folders for now.
    "bingocardgenerator.html": ("Teacher Tools", "Printable Generators"),
    "wordsearchgenerator.html": ("Teacher Tools", "Printable Generators"),
    "maze_creator.html": ("Teacher Tools", "Printable Generators"),
    "graph_paper_generator.html": ("Teacher Tools", "Printable Generators"),
    "circle_graph_generator.html": ("Teacher Tools", "Printable Generators"),
    "attendance_maker.html": ("Teacher Tools", "Classroom Management"),
    "random_group_maker_offline.html": ("Teacher Tools", "Classroom Management"),
    "instructional_intelligence.html": ("Teacher Tools", "Instructional Resources"),
    "mnemonic_maker.html": ("Teacher Tools", "Instructional Resources"),
    "poker_basics.html": ("Learning & Reference", "Game Rules & Tutorials"),

    # Music creation is different from musical ear training.
    "music_trivia_board.html": ("Word, Trivia & Quiz Games", "Trivia & Guessing Games"),
    "piano melody maker.html": ("Music & Ear Training", "MIDI & Music Creation"),
    "pitch_in_the_middle.html": ("Music & Ear Training", "Ear Training"),
    "midi_drum_pattern_maker.html": ("Music & Ear Training", "MIDI & Music Creation"),
    "scale_midi_maker.html": ("Music & Ear Training", "MIDI & Music Creation"),
    "binaural_beat_maker.html": ("Music & Ear Training", "Sound Generation"),
    "binaural_beat_journey_maker.html": ("Music & Ear Training", "Sound Generation"),

    # Board, table, memory, and recreational sports games.
    "draw_from_memory.html": ("Word, Trivia & Quiz Games", "Memory Games"),
    "word_memory_challenge.html": ("Word, Trivia & Quiz Games", "Memory Games"),
    "number_memory_challenge.html": ("Word, Trivia & Quiz Games", "Memory Games"),
    "major-system-quiz.html": ("Word, Trivia & Quiz Games", "Memory Games"),
    "roulette_casino.html": ("Card & Table Games", "Casino Games"),
    "royal_felt_baccarat.html": ("Card & Table Games", "Casino Games"),
    "royal_felt_blackjack.html": ("Card & Table Games", "Casino Games"),
    "texas_holdem.html": ("Card & Table Games", "Casino Games"),
    "snakes_and_ladders.html": ("Strategy, Board & Logic Games", "Classic Board & Dice Games"),
    "snakesandladders.html": ("Strategy, Board & Logic Games", "Classic Board & Dice Games"),
    "yahtzee.html": ("Strategy, Board & Logic Games", "Classic Board & Dice Games"),
    "checkers_game.html": ("Strategy, Board & Logic Games", "Classic Board & Dice Games"),
    "retro_mahjongg.html": ("Strategy, Board & Logic Games", "Logic & Number Puzzles"),
    "jigsaw_puzzle.html": ("Strategy, Board & Logic Games", "Logic & Number Puzzles"),
    "tangram_puzzles.html": ("Strategy, Board & Logic Games", "Logic & Number Puzzles"),
    "sliding_number_puzzle.html": ("Strategy, Board & Logic Games", "Logic & Number Puzzles"),
    "slidingnumberpuzzle.html": ("Strategy, Board & Logic Games", "Logic & Number Puzzles"),
    "meowdoku.html": ("Strategy, Board & Logic Games", "Logic & Number Puzzles"),
    "hexa_sudoku.html": ("Strategy, Board & Logic Games", "Logic & Number Puzzles"),
    "hexasudoku.html": ("Strategy, Board & Logic Games", "Logic & Number Puzzles"),
    "shikaku.html": ("Strategy, Board & Logic Games", "Logic & Number Puzzles"),
    "shikakublanks.html": ("Strategy, Board & Logic Games", "Logic & Number Puzzles"),
    "shikaku_level_progression.html": ("Strategy, Board & Logic Games", "Logic & Number Puzzles"),
    "hex_merge.html": ("Strategy, Board & Logic Games", "Logic & Number Puzzles"),
    "number_match_and_10.html": ("Strategy, Board & Logic Games", "Logic & Number Puzzles"),
    "croquet_club.html": ("Arcade & Action Games", "Sports Games"),
    "neon_eight_pool.html": ("Arcade & Action Games", "Sports Games"),
    "mini_golf.html": ("Arcade & Action Games", "Sports Games"),
    "janky_mini_golf.html": ("Arcade & Action Games", "Sports Games"),
    "cliff_dive.html": ("Arcade & Action Games", "Sports Games"),
    "wordnomino.html": ("Word, Trivia & Quiz Games", "Word Games"),
    "blank_comic_strip_generator.html": ("Art, Media & Creation", "Comic & Annotation Tools"),
    "comic_text_remover.html": ("Art, Media & Creation", "Comic & Annotation Tools"),
    "scattergories.html": ("Word, Trivia & Quiz Games", "Party & Word Games"),
    "wheel_of_fortune.html": ("Word, Trivia & Quiz Games", "Party & Word Games"),
}

# Separate prefix rules from filename keyword rules: an explicit folder match
# must be a real path prefix, never a substring found in a filename.
FOLDER_CATEGORY_PREFIXES: List[Tuple[str, str, str]] = [
    ("learning_reference/game_rules_tutorials/", "Learning & Reference", "Game Rules & Tutorials"),
    ("learning_reference/driver_education/", "Learning & Reference", "Driver Education"),
    ("learning_reference/study_skills/", "Learning & Reference", "Study & Memory Skills"),
    ("learning_reference/", "Learning & Reference", "General Reference"),
    ("creative_tools/writing/", "Literacy & ELA", "Creative Writing & Prompts"),
    ("teacher_tools/printable_generators/", "Teacher Tools", "Printable Generators"),
    ("teacher_tools/accessibility_communication/", "Teacher Tools", "Accessibility & Communication"),
    ("teacher_tools/classroom_utilities/", "Teacher Tools", "Classroom Utilities"),
    ("teacher_tools/instructional_resources/", "Teacher Tools", "Instructional Resources"),
    ("teacher_tools/", "Teacher Tools", "Classroom Utilities"),
    ("subject_specific/math/test_preparation/", "Math & Numeracy", "Test Preparation"),
    ("subject_specific/math/generators/", "Math & Numeracy", "Math Generators"),
    ("subject_specific/math/concept_explorers/", "Math & Numeracy", "Concept Explorers & Lessons"),
    ("subject_specific/math/skill_practice/", "Math & Numeracy", "Skill Practice"),
    ("subject_specific/math/curriculum_practice/", "Math & Numeracy", "Curriculum & Grade-Level Practice"),
    ("subject_specific/math/", "Math & Numeracy", "Curriculum & Grade-Level Practice"),
    ("subject_specific/ela/writing/", "Literacy & ELA", "Creative Writing & Prompts"),
    ("subject_specific/ela/curriculum_practice/", "Literacy & ELA", "ELA Practice"),
    ("subject_specific/ela/spelling_word_work/", "Literacy & ELA", "Vocabulary & Spelling"),
    ("subject_specific/ela/", "Literacy & ELA", "ELA Practice"),
    ("subject_specific/science/simulations/", "Science & Social Studies", "Science Simulations & Labs"),
    ("subject_specific/science/curriculum_practice/", "Science & Social Studies", "Science Lessons"),
    ("subject_specific/science/", "Science & Social Studies", "Science Lessons"),
    ("subject_specific/social_studies/curriculum_practice/", "Science & Social Studies", "Social Studies"),
    ("subject_specific/social_studies/", "Science & Social Studies", "Social Studies"),
    ("sports_fitness/basketball/", "Sports & Fitness", "Sports Instruction"),
    ("sports_fitness/fitness_tools/", "Sports & Fitness", "Fitness Tools"),
    ("utilities/audio/", "Utilities & Tools", "Audio Tools"),
    ("utilities/documents_files/", "Utilities & Tools", "Document & File Tools"),
    ("utilities/general/", "Utilities & Tools", "General Utilities"),
    ("utilities/reading/", "Utilities & Tools", "Reading Utilities"),
    ("utilities/web_sharing/", "Utilities & Tools", "Web & Sharing Tools"),
    ("utilities/wellness/", "Utilities & Tools", "Wellness Tools"),
    ("creative_tools/art/", "Art, Media & Creation", "Art & Image Tools"),
    ("creative_tools/generators/", "Art, Media & Creation", "Creative Generators"),
    ("creative_tools/music/ear_training/", "Music & Ear Training", "Ear Training"),
    ("creative_tools/music/music_creation/", "Music & Ear Training", "MIDI & Music Creation"),
    ("creative_tools/music/music_theory/", "Music & Ear Training", "Music Theory & Instruments"),
    ("creative_tools/music/sound_generation/", "Music & Ear Training", "Sound Generation"),
    ("creative_tools/music/", "Music & Ear Training", "Music Theory & Instruments"),
    ("misc_games/casinogames/", "Card & Table Games", "Casino Games"),
    ("misc_games/cardgames/", "Card & Table Games", "Card & Solitaire Games"),
    ("misc_games/card_games/", "Card & Table Games", "Card & Solitaire Games"),
    ("misc_games/sportsgames/", "Arcade & Action Games", "Sports Games"),
    ("misc_games/memorygames/", "Word, Trivia & Quiz Games", "Memory Games"),
    ("misc_games/geographygames/", "Word, Trivia & Quiz Games", "Geography Games"),
    ("misc_games/hangman/", "Word, Trivia & Quiz Games", "Word Games"),
    ("misc_games/kolumns/", "Arcade & Action Games", "Tetris & Falling Blocks"),
    ("misc_games/aquariumsandbox/", "Arcade & Action Games", "Simulation & Sandbox Games"),
    ("misc_games/trivia/", "Word, Trivia & Quiz Games", "Trivia & Guessing Games"),
    ("misc_games/dle_and_thisorthat_games/", "Word, Trivia & Quiz Games", "Trivia & Guessing Games"),
    ("misc_games/wordgames/", "Word, Trivia & Quiz Games", "Word Games"),
    ("misc_games/chessgames/", "Strategy, Board & Logic Games", "Chess & Knight Games"),
    ("misc_games/connectfour/", "Strategy, Board & Logic Games", "Tic-Tac-Toe & Connect Four"),
    ("misc_games/tictactoegames/", "Strategy, Board & Logic Games", "Tic-Tac-Toe & Connect Four"),
    ("misc_games/boardgames/", "Strategy, Board & Logic Games", "Classic Board & Dice Games"),
    ("misc_games/logicpuzzles/", "Strategy, Board & Logic Games", "Logic & Number Puzzles"),
    ("misc_games/strategy_games/", "Strategy, Board & Logic Games", "Abstract Strategy Games"),
    ("misc_games/mazes/", "Strategy, Board & Logic Games", "Mazes & Logic Puzzles"),
    ("misc_games/tetris_games/", "Arcade & Action Games", "Tetris & Falling Blocks"),
    ("misc_games/arcadegames/", "Arcade & Action Games", "Classic Arcade"),
    ("math_games/mathpursuit/", "Math & Numeracy", "Math Games"),
    ("math_games/mathbingo/", "Math & Numeracy", "Math Games"),
    ("math_games/mathfacts/", "Math & Numeracy", "Math Facts & Operations"),
    ("math_games/", "Math & Numeracy", "Math Games"),
]

# File-specific overrides that must include their parent folder, e.g. an
# index.html file with an otherwise meaningless basename.
EXACT_PATH_CATEGORIES: Dict[str, Tuple[str, str]] = {
    "creative_tools/generators/arcadeweaver_studio/index.html": ("Art, Media & Creation", "Game Creation"),
    "creative_tools/generators/arcade_weaver_studio/index.html": ("Art, Media & Creation", "Game Creation"),
    "misc_games/strategy_games/meowdoku/index.html": ("Strategy, Board & Logic Games", "Logic & Number Puzzles"),
}


def classify_subject_test(filename: str) -> Tuple[str, str]:
    """Infer subject for files still sharing the legacy SubjectTests folder."""
    n = normalize_for_keyword_match(filename)
    if any(word in n for word in ("math", "algebra", "numeracy")):
        return "Math & Numeracy", "Test Preparation"
    if any(word in n for word in ("ela", "english", "literacy", "spelling")):
        return "Literacy & ELA", "ELA Practice"
    if "science" in n:
        return "Science & Social Studies", "Science Lessons"
    if "social" in n or "history" in n:
        return "Science & Social Studies", "Social Studies"
    return "Teacher Tools", "Instructional Resources"


# Some apps may temporarily exist in more than one repository location while
# folders are being reorganized. These titles should appear only once in the
# generated indexes. Matching is based on the displayed title, not the path.
DEDUPLICATE_DISPLAY_TITLES = {
    "airplane race game",
}


def deduplicate_entries(entries: List["FileEntry"]) -> List["FileEntry"]:
    """Remove known duplicate app cards while preferring their canonical folder."""
    if not entries:
        return entries

    def preference(entry: "FileEntry") -> tuple[int, int, int, str]:
        rel = normalize_path(entry.rel_path).casefold()

        # Canonical home for Airplane Race Game.
        if entry.title.casefold() == "airplane race game":
            canonical = 0 if "misc_games/arcadegames/" in rel else 1
            return (0 if entry.canonical else 1, canonical, len(rel), rel)

        return (0 if entry.canonical else 1, 0, len(rel), rel)

    grouped: Dict[str, List["FileEntry"]] = {}
    passthrough: List["FileEntry"] = []

    canonical_titles = {e.title.casefold() for e in entries if e.canonical}
    for entry in entries:
        title_key = entry.title.casefold()
        if title_key in DEDUPLICATE_DISPLAY_TITLES or title_key in canonical_titles:
            grouped.setdefault(title_key, []).append(entry)
        else:
            passthrough.append(entry)

    for title_key, duplicates in grouped.items():
        duplicates.sort(key=preference)
        passthrough.append(duplicates[0])

    return passthrough


# Classroom relevance is a separate decision from display category. Broad game
# categories and all casino games are NOT automatically educational.
EDUCATIONAL_CATEGORIES = {
    "Math & Numeracy",
    "Literacy & ELA",
    "Science & Social Studies",
    "Teacher Tools",
    "Learning & Reference",
    "Sports & Fitness",
    "Art, Media & Creation",
    "Music & Ear Training",
}

# Hard blocks run before every other education rule, including explicit allows.
# The path check also protects against new casino games added in the future.
EDUCATIONAL_BLOCKED_PATH_TOKENS = (
    "casino", "roulette", "baccarat", "blackjack", "holdem", "slot_machine",
    "slots_game", "poker_solitaire", "real_money", "betting",
)
EDUCATIONAL_EXCLUDE_FILENAMES = {
    "alive_for.html",
    "billboardnumberone.html",
    "drop67.html",
    "hockeystats.html",
    "linedraw.html",
    "snakes_and_ladders.html",
    "snakesandladders.html",
    "soccerstats.html",
    "weightgame.html",
}
# Educational games are opted in by individual purpose/name, not by the broad
# category they happen to appear in. Other strategy/word/card games remain on
# the public index and can be added here after an intentional review.
EDUCATIONAL_GAME_INCLUDE_FILENAMES = {
    "antisimon.html", "music_trivia_board.html", "chess_add_ranks_files.html", "chess_blocked_squares.html",
    "chess_point_removal.html", "chess_remove_files.html",
    "chess_remove_ranks.html", "chess_same_piece_army.html",
    "local_chess_with_cpu.html", "knights_tour.html",
    "knights-tour-blocked.html", "knight-tour-multiplayer.html",
    "boggle_game.html", "cryptoquip.html", "scraggle.html",
    "scattergories.html", "scrabble100.html", "word-ladder.html",
    "word_maker_game.html", "unusual_words_game.html", "hangman.html",
    "word_memory_challenge.html", "number_memory_challenge.html",
    "draw_from_memory.html", "major-system-quiz.html",
    "numdle.html", "binarydle.html", "shikaku.html",
    "shikaku_blanks.html", "shikaku_level_progression.html",
    "hexa_sudoku.html", "meowdoku.html", "sliding_number_puzzle.html",
    "tangram_puzzles.html", "jigsaw_puzzle.html", "wordnomino.html",
    "word_vault.html", "canada_click_challenge.html",
    "world_click_challenge.html", "geography_trivia_game.html",
    "canadian_trivia_game.html", "history_date_challenge.html",
    "kids_teens_trivia.html", "polygon_guess.html", "realcityornot.html",
    "word_definition_quiz.html", "word_scrambler_maker.html",
}
# New classroom-focused game titles can still be detected conservatively, but
# a blanket "word" or "quiz" filename match is too permissive.
EDUCATIONAL_INCLUDE_KEYWORDS = (
    "algebra", "cartesian", "decimal", "divisibility", "fraction",
    "geography", "grammar", "math", "multiplication", "numeracy",
    "science", "spelling", "vocabulary", "chess", "sudoku",
)

# Each rule is:
#   (tokens_to_match, category, subcategory)
#
# The first matching rule wins, so keep specific rules above broad rules.
# Tokens are checked against the full relative path and filename.
CATEGORY_RULES: List[Tuple[Tuple[str, ...], str, str]] = [
    # -----------------------------------------------------------------------
    # New directory structure: explicit folder rules come first.
    # This makes the repository layout the primary source of truth and keeps
    # broad filename keywords from pulling moved apps into the wrong category.
    # -----------------------------------------------------------------------

    # Science simulations moved out of Misc.
    (("subject_specific/science/simulations/",), "Science & Social Studies", "Science Simulations & Labs"),

    # Teacher Tools subfolders must be checked before the broad Teacher_Tools rule.
    (("teacher_tools/accessibility_communication/",), "Teacher Tools", "Accessibility & Communication"),
    (("teacher_tools/classroom_utilities/",), "Teacher Tools", "Classroom Utilities"),

    # Learning / reference.
    (("learning_reference/driver_education/",), "Learning & Reference", "Driver Education"),

    # Sports / fitness.
    (("sports_fitness/basketball/",), "Sports & Fitness", "Basketball"),
    (("sports_fitness/fitness_tools/",), "Sports & Fitness", "Fitness Tools"),

    # Utilities. These rules intentionally come before older QR/audio/EPUB
    # keyword rules so the new Utilities folders win.
    (("utilities/audio/",), "Utilities & Tools", "Audio Tools"),
    (("utilities/documents_files/",), "Utilities & Tools", "Document & File Tools"),
    (("utilities/general/",), "Utilities & Tools", "General Utilities"),
    (("utilities/reading/",), "Utilities & Tools", "Reading Utilities"),
    (("utilities/wellness/",), "Utilities & Tools", "Wellness Tools"),
    (("utilities/web_sharing/",), "Utilities & Tools", "Web & Sharing Tools"),

    # Creative Tools. Music gets its more specific rules later, before the
    # general creative_tools/music/ fallback.
    (("creative_tools/generators/",), "Art, Media & Creation", "Creative Generators"),
    (("creative_tools/art/",), "Art, Media & Creation", "Art & Image Tools"),

    # New game subfolder.
    (("misc_games/memorygames/",), "Word, Trivia & Quiz Games", "Memory Games"),

    # -----------------------------------------------------------------------
    # Subject-specific / curriculum folders
    # -----------------------------------------------------------------------
    # Specific ELA files must come before the broad Subject_Specific/ELA rule.
    (("subject_specific/ela/typing-test", "subject_specific/ela/typing_test"), "Literacy & ELA", "Typing & Keyboarding"),
    (("subject_specific/ela/madlib",), "Literacy & ELA", "Writing & Word Work"),

    # Keep ELA-specific names here, before Science/Social rules, so files like
    # "Alberta ELA Practice.html" do not fall into a broader grouping.
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
    # SubjectTests files are routed by their actual subject before this table.
    (("subjecttests",), "Teacher Tools", "Instructional Resources"),

    # -----------------------------------------------------------------------
    # Explicit cross-folder exceptions
    # -----------------------------------------------------------------------
    # Bingo Card Generator is a classroom utility even though the file is
    # physically stored inside Math_Games/MathBingo.
    (("bingocardgenerator.html",), "Teacher Tools", "Classroom Utilities"),

    # -----------------------------------------------------------------------
    # Math
    # -----------------------------------------------------------------------
    (("math_games/mathfacts/", "factscount", "four_facts", "operationmemory", "operationsgames"), "Math & Numeracy", "Math Facts & Operations"),
    # Do NOT use generic "multi_" here: it incorrectly matches filenames such
    # as multiplayer. Use specific multiplication terms instead.
    (("multiplication", "multi_2_and_3", "division", "long_division", "divisibility"), "Math & Numeracy", "Multiplication & Division"),
    (("algebra", "input_output", "input-output", "pedmas", "decimal", "fraction", "target_number"), "Math & Numeracy", "Number Sense & Problem Solving"),
    # Generic "bingo" is intentionally omitted so Bingo Caller can remain a
    # classroom utility. Actual Math Bingo files/folders still match mathbingo.
    (("mathbingo",), "Math & Numeracy", "Math Games"),
    (("cartesian", "dice_grid", "7dice", "15-tictactoe", "telling_time", "10frames", "magic-square"), "Math & Numeracy", "Number Sense & Problem Solving"),
    (("math_games/",), "Math & Numeracy", "Math Games"),

    # -----------------------------------------------------------------------
    # Literacy, language, and reading
    # -----------------------------------------------------------------------
    (("acrostic", "haiku", "poem", "raft", "pwim", "fry", "word_scrambler", "wordle", "madlib"), "Literacy & ELA", "Writing & Word Work"),
    (("epub_reader", "reading"), "Literacy & ELA", "Reading Tools"),
    (("wordsearchgenerator", "word_search", "wordsearch"), "Literacy & ELA", "Word Work Generators"),

    # -----------------------------------------------------------------------
    # Teacher/classroom tools
    # -----------------------------------------------------------------------
    (("clickable_aac", "aac_word_board"), "Teacher Tools", "Accessibility & Communication"),
    (("attendance", "random_group", "word_cloud", "dice_roller", "random_card", "bingo_caller"), "Teacher Tools", "Classroom Utilities"),
    (("teacher_tools/",), "Teacher Tools", "Classroom Utilities"),

    # -----------------------------------------------------------------------
    # Art, media, creation
    # -----------------------------------------------------------------------
    (("annotator", "blank_comic"), "Art, Media & Creation", "Comic & Annotation Tools"),
    (("art related/", "comic", "pointillism", "rorschach", "mandala", "image_to_ascii", "ascii_art", "reveal_color"), "Art, Media & Creation", "Art & Image Tools"),

    # -----------------------------------------------------------------------
    # Music
    # -----------------------------------------------------------------------
    (("creative_tools/music/ear_training/", "ear_training/", "ear_training", "chord_ear", "interval", "melody", "mode_recognition", "scale_recognition", "pitch_higher", "note_in_chord"), "Music & Ear Training", "Ear Training"),
    (("guitar", "ukulele", "harmonic", "build_the_chord", "chord_progression", "chord_finder", "scale_mapper"), "Music & Ear Training", "Guitar, Chords & Theory"),
    (("creative_tools/music/", "music/"), "Music & Ear Training", "Music & Practice Tools"),

    # -----------------------------------------------------------------------
    # Arcade/action
    # -----------------------------------------------------------------------
    # Specific falling-block families come before the broad ArcadeGames folder
    # rule so they stay together even when stored inside ArcadeGames.
    (("kolumn", "tetris_games/", "tetris", "typing_tetris"), "Arcade & Action Games", "Tetris & Falling Blocks"),
    (("line_draw", "arcadegames/", "arcade", "jezzball", "pacman", "ghost", "pong", "snake", "runner", "target_practice", "pool_ball", "drop", "sky_stacker", "antisimon", "timer_accuracy", "airplane race game"), "Arcade & Action Games", "Arcade Games"),
    (("arrow_escape", "paint_maze"), "Arcade & Action Games", "Action Challenges"),

    # -----------------------------------------------------------------------
    # Strategy/board/logic
    # -----------------------------------------------------------------------
    (("cardgames/", "card_games/", "card-games/", "cardgames", "card_games", "card-games", "solitaire"), "Card & Table Games", "Card & Solitaire Games"),
    (("chessgames/", "chess", "knight-tour", "knights-tour"), "Strategy, Board & Logic Games", "Chess & Knight Games"),
    (("connectfour/", "connect4", "connect_4"), "Strategy, Board & Logic Games", "Tic-Tac-Toe & Connect Four"),
    (("sliding number puzzle", "sliding_number_puzzle", "strategy_games/", "shikaku", "go_local", "go.html", "hex", "nim", "ataxx", "minesweeper", "dots-and-boxes", "bridgit", "obstruction", "battleship", "checkers", "snakes_and_ladders", "snakes-and-ladders", "sim.html", "hold-the-line", "black-hole", "rabbit_hunt"), "Strategy, Board & Logic Games", "Strategy & Logic Games"),
    (("tictactoegames/", "tic_tac_toe", "tictactoe", "ultimate_tic", "order-and-chaos", "exact-four", "row_call"), "Strategy, Board & Logic Games", "Tic-Tac-Toe & Connect Four"),
    (("maze", "hexa", "sudoku"), "Strategy, Board & Logic Games", "Mazes & Logic Puzzles"),

    # -----------------------------------------------------------------------
    # Word, trivia, quizzes, memory
    # -----------------------------------------------------------------------
    (("dle_and_thisorthat_games/", "dle", "thisorthat", "truth_or_bologna", "realcity", "citypop", "billboard", "hockey", "soccer", "weightgame", "canprices", "polygon_guess", "numdle", "binarydle", "canadian trivia game", "geography trivia game", "history date challenge", "kids teens trivia"), "Word, Trivia & Quiz Games", "Trivia & Guessing Games"),
    (("wordgames/", "hangman", "scrabble", "boggle", "word-ladder", "word_maker", "unusual_words", "word_memory"), "Word, Trivia & Quiz Games", "Word Games"),
    (("number_memory", "draw_from_memory", "major-system"), "Word, Trivia & Quiz Games", "Memory Games"),
    (("canada_click", "world_click"), "Word, Trivia & Quiz Games", "Geography Games"),
    (("scattergories", "wheel_of_fortune"), "Word, Trivia & Quiz Games", "Party & Word Games"),

    # Fallback broad game folder only. There is intentionally NO Misc fallback:
    # Misc was removed from the repository structure and should not silently map
    # to Teacher Tools if an old folder is accidentally reintroduced.
    (("misc_games/",), "Strategy, Board & Logic Games", "Other Games"),
]



# ---------------------------------------------------------------------------
# Data structures
# ---------------------------------------------------------------------------

@dataclass
class FileEntry:
    name: str
    rel_path: str
    title: str
    category: str
    subcategory: str
    icon: str
    mtime: float | None = None
    tags: Tuple[str, ...] = ()
    classification_source: str = "legacy-keyword"
    educational_override: bool | None = None
    canonical: bool = False


@dataclass
class FolderNode:
    name: str
    rel_path: str
    files: List[FileEntry] = field(default_factory=list)
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


@lru_cache(maxsize=None)
def normalize_path(s: str) -> str:
    return s.replace("\\", "/").strip("/")


@lru_cache(maxsize=None)
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


@lru_cache(maxsize=None)
def split_camel_and_numbers(text: str) -> str:
    """Add spaces around acronyms, CamelCase, and letter/number boundaries."""
    text = ACRONYM_PATTERN.sub(lambda match: f" {ACRONYM_LOOKUP[match.group(0).casefold()]} ", text)
    text = re.sub(r"(?<=[a-z0-9])(?=[A-Z])", " ", text)
    text = re.sub(r"(?<=[A-Z])(?=[A-Z][a-z])", " ", text)
    text = re.sub(r"(?<=[A-Za-z])(?=[0-9])", " ", text)
    text = re.sub(r"(?<=[0-9])(?=[A-Za-z])", " ", text)
    return re.sub(r"\s+", " ", text).strip()


@lru_cache(maxsize=None)
def normalize_for_keyword_match(text: str) -> str:
    """Normalize paths and filenames for safer keyword matching."""
    text = normalize_path(split_camel_and_numbers(text)).casefold()
    text = re.sub(r"[^a-z0-9]+", " ", text)
    return re.sub(r"\s+", " ", text).strip()


# These short/common words should only match as their own token/phrase.
# This prevents false positives such as "go" matching "Boggle" or "logo".
BROAD_ICON_KEYWORDS = {
    "go",
    "qr",
    "dle",
    "sim",
    "nim",
    "hex",
    "sky",
    "run",
    "ball",
    "city",
    "time",
    "mode",
    "word",
    "game",
    "play",
}

BROAD_CATEGORY_TOKENS = {
    "go",
    "go.html",
    "sim.html",
    "nim.html",
    "dle",
    "sim",
    "nim",
    "hex",
    "maze",
    "social",
    "drop",
}


def keyword_matches(text: str, keyword: str, *, broad_keywords: set[str]) -> bool:
    """Return True when a keyword safely matches text.

    Most existing rules keep their historical substring behavior. Very short or
    ambiguous keywords are matched only as normalized whole tokens/phrases so
    they do not accidentally match inside unrelated words.
    """
    return _keyword_matches_cached(text, keyword, tuple(sorted(broad_keywords)))


@lru_cache(maxsize=None)
def _keyword_matches_cached(text: str, keyword: str, broad_keywords: Tuple[str, ...]) -> bool:
    key = keyword.casefold().strip()
    if not key:
        return False

    normalized_text = normalize_for_keyword_match(text)
    normalized_key = normalize_for_keyword_match(key)
    if not normalized_key:
        return False

    should_use_token_match = (
        key in broad_keywords
        or (len(normalized_key) <= 3 and " " not in normalized_key)
    )

    if should_use_token_match:
        pattern = rf"(?<![a-z0-9]){re.escape(normalized_key)}(?![a-z0-9])"
        return re.search(pattern, normalized_text) is not None

    compact_text = normalized_text.replace(" ", "")
    compact_key = normalized_key.replace(" ", "")
    return normalized_key in normalized_text or compact_key in compact_text




@lru_cache(maxsize=None)
def has_canada_term(text: str) -> bool:
    """Return True for Canada/Canadian terms in filenames or folder paths."""
    normalized = normalize_for_keyword_match(text)
    return any(
        re.search(rf"(?<![a-z0-9]){term}(?![a-z0-9])", normalized)
        for term in ("canada", "canadian")
    )


@lru_cache(maxsize=None)
def has_yahtzee_term(text: str) -> bool:
    """Return True for Yahtzee filenames or paths."""
    return keyword_matches(text, "yahtzee", broad_keywords=BROAD_ICON_KEYWORDS)

@lru_cache(maxsize=None)
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


@lru_cache(maxsize=None)
def display_name(name: str, *, strip_extension: bool = False) -> str:
    base = Path(name).name
    override = DISPLAY_NAME_OVERRIDES.get(base.casefold())
    if override:
        return override

    raw = base
    if strip_extension:
        raw = Path(raw).stem

    raw = raw.replace("_", " ").replace("-", " ")
    raw = split_camel_and_numbers(raw)
    raw = re.sub(r"\s+", " ", raw).strip()

    words = []
    for word in raw.split(" "):
        low = word.casefold()
        if low in ACRONYM_LOOKUP:
            words.append(ACRONYM_LOOKUP[low])
        elif word.isupper():
            words.append(word)
        else:
            words.append(word[:1].upper() + word[1:])
    return " ".join(words)


class PageTitleParser(HTMLParser):
    """Collect the text from the first HTML title element."""

    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.in_title = False
        self.finished = False
        self.parts: List[str] = []

    def handle_starttag(self, tag: str, attrs: List[Tuple[str, str | None]]) -> None:
        if not self.finished and tag.casefold() == "title":
            self.in_title = True

    def handle_endtag(self, tag: str) -> None:
        if self.in_title and tag.casefold() == "title":
            self.in_title = False
            self.finished = True

    def handle_data(self, data: str) -> None:
        if self.in_title:
            self.parts.append(data)


def html_page_title(path: Path) -> str:
    """Read an HTML page's title without loading a large single-file app fully."""
    try:
        with path.open("rb") as html_file:
            head = html_file.read(512 * 1024)
    except OSError:
        return ""

    parser = PageTitleParser()
    try:
        parser.feed(head.decode("utf-8-sig", errors="replace"))
        parser.close()
    except Exception:
        return ""

    return re.sub(r"\s+", " ", "".join(parser.parts)).strip()


def title_for_path(path: Path) -> str:
    """Choose the visible link title, with special handling for index.html."""
    if path.name.casefold() != "index.html":
        return display_name(path.name, strip_extension=True)

    page_title = html_page_title(path)
    if page_title:
        return page_title

    if path.parent.name:
        return display_name(path.parent.name)
    return "Home"


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
    if lower_fn in {"source.html", "sources.html", "preview.html", "preview.htm"}:
        return False
    if not include_root_files and "/" not in rel:
        return False
    if hide_all_index_html and lower_rel.endswith("/index.html"):
        return False
    if hide_root_index_html and lower_rel == "index.html":
        return False
    if hide_nsfw_anywhere and "nsfw" in lower_rel:
        return False
    return True


# ---------------------------------------------------------------------------
# Icons and categorization
# ---------------------------------------------------------------------------

@lru_cache(maxsize=None)
def icon_for(name: str, is_dir: bool) -> str:
    base = Path(name).name

    if has_canada_term(name):
        return safe_icon("🇨🇦")
    if has_yahtzee_term(name):
        return safe_icon("🎲")

    if base.casefold() in CUSTOM_ICONS_CASEFOLD:
        return safe_icon(CUSTOM_ICONS_CASEFOLD[base.casefold()])

    low = name.casefold()
    matches = [(key, icon) for key, icon in ICON_RULES if keyword_matches(low, key, broad_keywords=BROAD_ICON_KEYWORDS)]
    if matches:
        matches.sort(key=lambda item: len(item[0]), reverse=True)
        return safe_icon(matches[0][1])

    return DEFAULT_FOLDER_ICON if is_dir else DEFAULT_FILE_ICON


@lru_cache(maxsize=None)
def icon_for_file(rel_path: str, category: str, subcategory: str) -> str:
    """Return a file icon without letting folder names mislabel the file.

    Exact filename overrides and filename keywords still work, but broad folder
    words are ignored for files. If nothing in the filename is clear, fall back
    to the already-decided subcategory/category. This is what keeps an ELA file
    inside a Science or Social folder from displaying a Science/Social icon.
    """
    base = Path(rel_path).name

    if has_canada_term(rel_path):
        return safe_icon("🇨🇦")
    if has_yahtzee_term(rel_path):
        return safe_icon("🎲")

    if base.casefold() in CUSTOM_ICONS_CASEFOLD:
        return safe_icon(CUSTOM_ICONS_CASEFOLD[base.casefold()])

    full_low = normalize_path(rel_path).casefold()
    if category == "Card & Table Games":
        return safe_icon("🎰" if subcategory == "Casino Games" else "🃏")
    if any(token in full_low for token in ("cardgames", "card_games", "card-games", "solitaire")):
        return safe_icon("🃏")

    low = base.casefold()
    matches = [(key, icon) for key, icon in ICON_RULES if keyword_matches(low, key, broad_keywords=BROAD_ICON_KEYWORDS)]
    if matches:
        matches.sort(key=lambda item: len(item[0]), reverse=True)
        return safe_icon(matches[0][1])

    if subcategory in SUBCATEGORY_ICONS:
        return safe_icon(SUBCATEGORY_ICONS[subcategory])

    return safe_icon(CATEGORY_ICONS.get(category, DEFAULT_FILE_ICON))


# ---------------------------------------------------------------------------
# Optional hand-curated catalog (index_catalog.json)
# ---------------------------------------------------------------------------
# Add exceptions and searchable tags here without modifying Python category rules.
# Priority: JSON exact path > built-in exact path > JSON filename > built-in
# exact filename > JSON folder prefix > built-in folder prefix > legacy keywords.
# Metadata (title, tags, educational flag, canonical) is merged independently:
# folder < filename < full path. A category override requires both fields.

@dataclass
class Catalog:
    apps: Dict[str, Dict[str, Any]] = field(default_factory=dict)
    filenames: Dict[str, Dict[str, Any]] = field(default_factory=dict)
    folders: List[Tuple[str, Dict[str, Any]]] = field(default_factory=list)
    source: str = ""


def catalog_path_key(raw: str, *, folder: bool = False) -> str:
    if not isinstance(raw, str) or not raw.strip():
        raise ValueError("Catalog keys must be nonempty paths/filenames")
    key = raw.strip().replace("\\", "/")
    if key.startswith("/") or ":" in key or any(part in ("", ".", "..") for part in key.strip("/").split("/")):
        raise ValueError(f"Unsafe catalog path: {raw!r}")
    if folder:
        return key.strip("/").casefold() + "/"
    return key.casefold()


def validate_metadata(value: object, label: str, *, require_category: bool = False) -> Dict[str, Any]:
    if not isinstance(value, dict):
        raise ValueError(f"{label}: expected a JSON object")
    allowed = {"category", "subcategory", "title", "tags", "icon", "educational", "canonical", "exclude"}
    unknown = set(value) - allowed
    if unknown:
        raise ValueError(f"{label}: unknown fields {sorted(unknown)}")
    if ("category" in value) != ("subcategory" in value) or (require_category and "category" not in value):
        raise ValueError(f"{label}: category and subcategory must be supplied together")
    for field_name in ("category", "subcategory", "title", "icon"):
        if field_name in value and (not isinstance(value[field_name], str) or not value[field_name].strip()):
            raise ValueError(f"{label}: {field_name} must be nonempty text")
    if "category" in value and value["category"] not in CATEGORY_ORDER:
        raise ValueError(f"{label}: unknown main category {value['category']!r}")
    for field_name in ("educational", "canonical", "exclude"):
        if field_name in value and not isinstance(value[field_name], bool):
            raise ValueError(f"{label}: {field_name} must be true or false")
    if "tags" in value:
        tags = value["tags"]
        if not isinstance(tags, list) or any(not isinstance(x, str) or not x.strip() for x in tags):
            raise ValueError(f"{label}: tags must be a list of nonempty strings")
    return dict(value)


def load_catalog(path: Path | None) -> Catalog:
    if path is None or not path.is_file():
        return Catalog()
    try:
        data = json.loads(path.read_text(encoding="utf-8-sig"))
    except (OSError, ValueError) as exc:
        raise ValueError(f"Could not read catalog {path}: {exc}") from exc
    if not isinstance(data, dict) or set(data) - {"version", "apps", "filenames", "folders"}:
        raise ValueError("Catalog must be a JSON object with only version/apps/filenames/folders fields")
    if data.get("version", 1) != 1:
        raise ValueError("Unsupported catalog version; expected 1")
    result = Catalog(source=str(path))
    for group_name, dest in (("apps", result.apps), ("filenames", result.filenames)):
        group = data.get(group_name, {})
        if not isinstance(group, dict):
            raise ValueError(f"Catalog {group_name} must be a JSON object")
        for raw_key, raw_meta in group.items():
            key = catalog_path_key(raw_key)
            if group_name == "filenames" and "/" in key:
                raise ValueError(f"Catalog filename rule must not contain a folder: {raw_key}")
            if key in dest:
                raise ValueError(f"Duplicate case-insensitive catalog key: {raw_key}")
            dest[key] = validate_metadata(raw_meta, f"{group_name}.{raw_key}")
    folders = data.get("folders", [])
    if not isinstance(folders, list):
        raise ValueError("Catalog folders must be a list")
    seen = set()
    for i, rule in enumerate(folders):
        if not isinstance(rule, dict) or "prefix" not in rule:
            raise ValueError(f"Catalog folders[{i}] needs a prefix")
        key = catalog_path_key(rule["prefix"], folder=True)
        if key in seen:
            raise ValueError(f"Duplicate folder prefix in catalog: {key}")
        seen.add(key)
        meta = validate_metadata({k: v for k, v in rule.items() if k != "prefix"}, f"folders[{i}]", require_category=True)
        result.folders.append((key, meta))
    result.folders.sort(key=lambda pair: -len(pair[0]))
    return result


def catalog_parts(rel_path: str, catalog: Catalog) -> Tuple[Dict[str, Any], Dict[str, Any], Dict[str, Any]]:
    rel = normalize_path(rel_path).casefold()
    prefix_meta = next((meta for prefix, meta in catalog.folders if rel.startswith(prefix)), {})
    return prefix_meta, catalog.filenames.get(Path(rel).name, {}), catalog.apps.get(rel, {})


def effective_metadata(rel_path: str, catalog: Catalog) -> Dict[str, Any]:
    folder_meta, filename_meta, path_meta = catalog_parts(rel_path, catalog)
    metadata: Dict[str, Any] = {}
    tag_sets: List[str] = []
    for layer in (folder_meta, filename_meta, path_meta):
        tag_sets.extend(layer.get("tags", []))
        metadata.update({key: value for key, value in layer.items() if key != "tags"})
    metadata["tags"] = list(dict.fromkeys(tag_sets))
    return metadata


# Searchable secondary tags, on top of user-written catalog tags.
SUBCATEGORY_SEARCH_TAGS = {
    "Concept Explorers & Lessons": ("tutorial", "lessons", "learn"),
    "Test Preparation": ("exam", "assessment", "practice test"),
    "Math Generators": ("worksheet", "generate"),
    "Printable Generators": ("printable", "worksheet", "PDF"),
    "Creative Writing & Prompts": ("writing", "creative writing", "prompts"),
    "Vocabulary & Spelling": ("spelling", "vocabulary"),
    "Casino Games": ("casino", "table game"),
    "Sports Games": ("sports", "game"),
    "Memory Games": ("memory", "training"),
    "Game Rules & Tutorials": ("rules", "tutorial", "how to play"),
    "MIDI & Music Creation": ("music", "MIDI", "composition"),
    "Sound Generation": ("sound", "audio"),
}


def tags_for(rel_path: str, subcategory: str, meta: Dict[str, Any]) -> Tuple[str, ...]:
    derived = SUBCATEGORY_SEARCH_TAGS.get(subcategory, ())
    all_tags = list(meta.get("tags", [])) + list(derived)
    return tuple(dict((tag.casefold(), tag) for tag in all_tags).values())


def classify_with_source(rel_path: str, catalog: Catalog) -> Tuple[str, str, str]:
    rel = normalize_path(rel_path).casefold()
    filename = Path(rel).name
    folder_meta, file_meta, path_meta = catalog_parts(rel, catalog)
    if "category" in path_meta:
        return path_meta["category"], path_meta["subcategory"], "catalog-path"
    if rel in EXACT_PATH_CATEGORIES:
        return (*EXACT_PATH_CATEGORIES[rel], "built-in-path")
    if "category" in file_meta:
        return file_meta["category"], file_meta["subcategory"], "catalog-filename"
    if filename in EXACT_APP_CATEGORIES:
        return (*EXACT_APP_CATEGORIES[filename], "built-in-filename")
    if "category" in folder_meta:
        return folder_meta["category"], folder_meta["subcategory"], "catalog-folder"
    if rel.startswith("subject_specific/subjecttests/"):
        return (*classify_subject_test(filename), "legacy-subject-test")
    if rel.startswith("creative_tools/generators/") and any(
        piece in rel for piece in ("arcadeweaver", "arcade_weaver")
    ):
        return "Art, Media & Creation", "Game Creation", "special-case"
    # Longest matching prefix wins; a parent folder cannot override its child.
    for prefix, category, subcategory in sorted(FOLDER_CATEGORY_PREFIXES, key=lambda rule: -len(rule[0])):
        if rel.startswith(prefix):
            return category, subcategory, "built-in-folder"
    for tokens, category, subcategory in CATEGORY_RULES:
        if any(keyword_matches(rel, token, broad_keywords=BROAD_CATEGORY_TOKENS)
               or keyword_matches(filename, token, broad_keywords=BROAD_CATEGORY_TOKENS)
               for token in tokens):
            return category, subcategory, "legacy-keyword"
    return "Other / Unsorted", "Other", "unclassified"


@lru_cache(maxsize=None)
def categorize_file(rel_path: str) -> Tuple[str, str]:
    """Backward-compatible built-in classification (no external catalog)."""
    category, subcategory, _ = classify_with_source(rel_path, Catalog())
    return category, subcategory



def is_educational(entry: FileEntry) -> bool:
    """Include classroom-relevant apps, excluding gambling and NSFW content."""
    filename = entry.name.casefold()
    rel_path = normalize_path(entry.rel_path).casefold()

    if "nsfw" in rel_path:
        return False
    if any(token in rel_path for token in EDUCATIONAL_BLOCKED_PATH_TOKENS):
        return False
    if filename in EDUCATIONAL_EXCLUDE_FILENAMES:
        return False
    if "tetris" in filename or "tetris_games/" in rel_path:
        return False
    if entry.educational_override is not None:
        return entry.educational_override

    if entry.category in EDUCATIONAL_CATEGORIES:
        return True
    if filename in EDUCATIONAL_GAME_INCLUDE_FILENAMES:
        return True
    # Allow recognizable educational game topics, but only when there is no
    # excluded casino or adult content in the path (checked above).
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
    catalog: Catalog | None = None,
    recent_source: str = "filesystem",
    return_raw: bool = False,
    prefer_page_titles: bool = False,
) -> List[FileEntry]:
    entries: List[FileEntry] = []
    catalog = catalog or Catalog()
    git_timestamps = git_last_changed(root) if recent_source == "git" else {}
    if recent_source == "git" and not git_timestamps:
        print("Note: Git dates unavailable; falling back to filesystem dates.")

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
            # Some extracted archives carry ZIP times ahead of the computer clock.
            # Cap those invalid future timestamps without changing the file itself.
            mtime = min(path.stat().st_mtime, time.time())
        except OSError:
            mtime = None

        meta = effective_metadata(rel, catalog)
        if meta.get("exclude", False):
            continue
        category, subcategory, method = classify_with_source(rel, catalog)
        page_title = html_page_title(path) if prefer_page_titles and path.suffix.casefold() == ".html" else ""
        suggested_title = title_for_path(path)
        # A short HTML title is preferable to the filename only when explicitly requested.
        if page_title and len(page_title) <= 75 and "\n" not in page_title:
            suggested_title = page_title
        title = meta.get("title", suggested_title)
        stamp = git_timestamps.get(rel.casefold(), mtime)
        entries.append(
            FileEntry(
                name=Path(rel).name,
                rel_path=rel,
                title=title,
                category=category,
                subcategory=subcategory,
                icon=meta.get("icon", icon_for_file(rel, category, subcategory)),
                mtime=stamp,
                tags=tags_for(rel, subcategory, meta),
                classification_source=method,
                educational_override=meta.get("educational"),
                canonical=meta.get("canonical", False),
            )
        )

    if not return_raw:
        entries = deduplicate_entries(entries)

    category_rank = {category: index for index, category in enumerate(CATEGORY_ORDER)}
    entries.sort(
        key=lambda item: (
            category_rank.get(item.category, 999),
            item.subcategory.casefold(),
            item.title.casefold(),
            item.rel_path.casefold(),
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


def add_file_to_tree(tree: FolderNode, entry: FileEntry) -> None:
    parts = [p for p in normalize_path(entry.rel_path).split("/") if p]
    parts.pop()  # filename
    node = tree
    accum = ""
    for dirname in parts:
        accum = f"{accum}/{dirname}" if accum else dirname
        node = get_or_create_dir(node, dirname, accum)
    node.files.append(entry)


def build_folder_tree(entries: Sequence[FileEntry]) -> FolderNode:
    tree = FolderNode(name="", rel_path="")
    for entry in entries:
        add_file_to_tree(tree, entry)
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


def recent_entries(entries: Sequence[FileEntry], days: int) -> List[FileEntry]:
    cutoff = datetime.now().timestamp() - (days * 24 * 60 * 60)
    recent = [entry for entry in entries if entry.mtime is not None and entry.mtime >= cutoff]
    recent.sort(key=lambda item: item.mtime or 0, reverse=True)
    return recent


# ---------------------------------------------------------------------------
# Page assets
# ---------------------------------------------------------------------------

INDEX_CSS = '  :root {\n    color-scheme: light;\n    --bg:#f4f6f8;\n    --panel:#ffffff;\n    --panel-soft:#fafbfc;\n    --border:#e4e8ee;\n    --text:#1f2937;\n    --muted:#667085;\n    --link:#0b66d0;\n    --accent:#2563eb;\n    --accent-soft:#eef5ff;\n    --shadow:0 8px 28px rgba(15, 23, 42, .08);\n    --radius:18px;\n  }\n  * { box-sizing:border-box; }\n  html { scroll-behavior:smooth; }\n  body { margin:0; font-family:Arial, sans-serif; color:var(--text); background:var(--bg); }\n  a { color:var(--link); text-decoration:none; }\n  a:hover { text-decoration:underline; }\n  .page { max-width:1500px; margin:0 auto; padding:24px; }\n  .hero {\n    background:linear-gradient(135deg, #ffffff, #f8fbff);\n    border:1px solid var(--border);\n    border-radius:24px;\n    box-shadow:var(--shadow);\n    padding:24px;\n    margin-bottom:20px;\n  }\n  .hero h1 { margin:0 0 8px; font-size:clamp(26px, 3vw, 38px); letter-spacing:-.03em; }\n  .hero p { margin:0; color:var(--muted); line-height:1.5; }\n  .hero .index-summary { line-height:1.25; }\n  .hero .ai-note { margin-top:0; }\n  .hero .ai-note a { font-weight:800; }\n  .pill-row { display:flex; flex-wrap:wrap; gap:8px; margin-top:14px; }\n  .pill {\n    display:inline-flex; align-items:center; gap:6px;\n    padding:6px 10px; border:1px solid var(--border); border-radius:999px;\n    background:#fff; color:var(--muted); font-size:.92rem;\n  }\n  .layout {\n    display:grid;\n    grid-template-columns:300px minmax(0, 1fr);\n    grid-template-areas:"sidebar search" "sidebar content";\n    gap:20px;\n    align-items:start;\n  }\n  .layout-search { grid-area:search; }\n  .sidebar {\n    grid-area:sidebar;\n    position:sticky;\n    top:18px;\n    background:var(--panel);\n    border:1px solid var(--border);\n    border-radius:var(--radius);\n    box-shadow:var(--shadow);\n    padding:18px;\n  }\n  .sidebar h2 { margin:0 0 14px; font-size:18px; }\n  .sidebar-list { list-style:none; margin:0; padding:0; display:flex; flex-direction:column; gap:5px; }\n  .sidebar-list a { display:block; padding:8px 10px; border-radius:12px; color:var(--text); }\n  .sidebar-list a:hover { background:var(--accent-soft); color:var(--link); text-decoration:none; }\n  .content { grid-area:content; display:flex; flex-direction:column; gap:18px; }\n  .category-block {\n    background:var(--panel);\n    border:1px solid var(--border);\n    border-radius:var(--radius);\n    box-shadow:var(--shadow);\n    padding:18px;\n  }\n  .category-heading {\n    display:flex;\n    align-items:center;\n    gap:10px;\n    font-size:21px;\n    font-weight:800;\n    margin-bottom:14px;\n    letter-spacing:-.02em;\n  }\n  .subcategory-block {\n    border:1px solid var(--border);\n    border-radius:16px;\n    background:var(--panel-soft);\n    padding:14px;\n  }\n  .subcategory-block + .subcategory-block { margin-top:14px; }\n  .subcategory-block h3 { margin:0 0 10px; font-size:16px; }\n  .app-list { list-style:none; padding:0; margin:0; display:flex; flex-direction:column; gap:8px; }\n  .app-item {\n    min-width:0;\n    padding:10px 12px;\n    border-radius:12px;\n    background:#fff;\n    border:1px solid rgba(228,232,238,.75);\n  }\n  .app-item:hover { border-color:#cbd8e8; box-shadow:0 4px 16px rgba(15,23,42,.06); }\n  .app-item a { display:inline-flex; align-items:center; gap:4px; font-weight:700; color:var(--text); }\n  .app-item a:hover { color:var(--link); text-decoration:none; }\n  .app-title { overflow-wrap:anywhere; }\n  .path-note { display:block; margin-top:4px; color:var(--muted); font-size:.82rem; overflow-wrap:anywhere; }\n  .changed-note { display:inline-block; margin-left:8px; color:var(--muted); font-size:.88rem; }\n  .muted { color:var(--muted); font-weight:400; margin-left:4px; font-size:.92em; }\n  .icon { display:inline-block; width:24px; text-align:center; margin-right:2px; flex:0 0 auto; }\n  .new-badge {\n    display:inline-block;\n    margin-left:8px;\n    padding:2px 8px;\n    border-radius:999px;\n    background:#ffe7a8;\n    color:#7a5300;\n    font-size:.75rem;\n    font-weight:800;\n    vertical-align:middle;\n  }\n  .recent-empty, .section-note { margin:0 0 12px; color:var(--muted); line-height:1.45; }\n  .search-panel {\n    background:var(--panel);\n    border:1px solid var(--border);\n    border-radius:var(--radius);\n    box-shadow:var(--shadow);\n    padding:16px 18px;\n  }\n  .search-label { display:block; font-size:14px; font-weight:800; margin-bottom:8px; color:var(--muted); }\n  .search-input {\n    width:100%;\n    padding:12px 14px;\n    border:1px solid var(--border);\n    border-radius:12px;\n    font-size:16px;\n    background:#fff;\n    color:var(--text);\n  }\n  .search-input:focus {\n    outline:none;\n    border-color:#b9d4f5;\n    box-shadow:0 0 0 4px rgba(11, 102, 208, .10);\n  }\n  .search-help { margin-top:8px; color:var(--muted); font-size:.92em; }\n  .search-empty {\n    display:none;\n    background:var(--panel);\n    border:1px solid var(--border);\n    border-radius:var(--radius);\n    box-shadow:var(--shadow);\n    padding:18px;\n    color:var(--muted);\n  }\n  details {\n    margin:10px 0;\n    border:1px solid var(--border);\n    border-radius:14px;\n    background:var(--panel-soft);\n    overflow:hidden;\n  }\n  summary {\n    cursor:pointer;\n    padding:12px 14px;\n    font-weight:800;\n    user-select:none;\n    list-style:none;\n  }\n  summary::-webkit-details-marker { display:none; }\n  summary::before { content:"▸"; display:inline-block; width:18px; color:#666; }\n  details[open] summary::before { content:"▾"; }\n  .nested { padding:0 12px 12px 18px; }\n  .folder-list { padding:10px 0; }\n  .footer { margin-top:18px; color:var(--muted); font-size:.95em; }\n  .last-updated { margin-bottom:0; }\n  .footer a { font-weight:800; }\n  @media (max-width: 980px) {\n    .page { padding:14px; }\n    .layout {\n      grid-template-columns:1fr;\n      grid-template-areas:"search" "sidebar" "content";\n    }\n    .sidebar { position:static; }\n  }'

INDEX_JS = '(function () {\n  const input = document.getElementById(\'site-search\');\n  const empty = document.getElementById(\'search-empty\');\n  if (!input) return;\n\n  function norm(s) {\n    return (s || \'\').toLowerCase().trim();\n  }\n\n  function isVisible(el) {\n    return !!el && el.style.display !== \'none\';\n  }\n\n  function formatLongDate(date) {\n    return date.toLocaleDateString(undefined, { year: \'numeric\', month: \'long\', day: \'numeric\' });\n  }\n\n  function updateChangedNotes() {\n    // The generator provides real timestamps, not date-only strings.\n    // Convert the exact same instants used for sorting into each viewer\'s local time.\n    const now = new Date();\n    const todayDay = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());\n    const millisPerDay = 86400000;\n\n    document.querySelectorAll(\'.changed-note[data-changed-epoch]\').forEach((note) => {\n      const seconds = Number(note.dataset.changedEpoch);\n      if (!Number.isFinite(seconds) || seconds <= 0) return;\n\n      const parsed = new Date(seconds * 1000);\n      if (Number.isNaN(parsed.getTime())) return;\n      // Future timestamps can occur in archives; never show "tomorrow".\n      const changed = parsed > now ? now : parsed;\n      const changedDay = Date.UTC(changed.getFullYear(), changed.getMonth(), changed.getDate());\n      const diffDays = Math.round((todayDay - changedDay) / millisPerDay);\n\n      let label = formatLongDate(changed);\n      if (diffDays === 0) label = \'Today\';\n      else if (diffDays === 1) label = \'Yesterday\';\n      else if (diffDays > 1) label = `${diffDays} days ago`;\n\n      note.textContent = label;\n      note.title = `Changed ${formatLongDate(changed)} at ${changed.toLocaleTimeString(undefined, { hour: \'numeric\', minute: \'2-digit\' })}`;\n    });\n  }\n\n  function applySearch() {\n    const q = norm(input.value);\n    const appItems = Array.from(document.querySelectorAll(\'.app-item\'));\n    const visiblePaths = new Set();\n\n    appItems.forEach((item) => {\n      const haystack = item.dataset.search || norm(item.textContent);\n      const match = !q || haystack.includes(q);\n      item.style.display = match ? \'\' : \'none\';\n      if (match && item.dataset.path) visiblePaths.add(item.dataset.path);\n    });\n\n    Array.from(document.querySelectorAll(\'.subcategory-block\')).forEach((block) => {\n      const show = !!block.querySelector(\'.app-item:not([style*="display: none"])\');\n      block.style.display = show ? \'\' : \'none\';\n    });\n\n    Array.from(document.querySelectorAll(\'.searchable-category\')).forEach((section) => {\n      const show = !!section.querySelector(\'.app-item:not([style*="display: none"]), .subcategory-block:not([style*="display: none"])\');\n      section.style.display = show ? \'\' : \'none\';\n    });\n\n    Array.from(document.querySelectorAll(\'details.dir-block\')).reverse().forEach((details) => {\n      const show = !q ||\n        !!details.querySelector(\'.app-item:not([style*="display: none"])\') ||\n        Array.from(details.querySelectorAll(\':scope > .nested > details.dir-block\')).some(isVisible);\n      details.style.display = show ? \'\' : \'none\';\n      if (q && show) details.open = true;\n    });\n\n    const folderView = document.querySelector(\'.folder-view-section\');\n    if (folderView) {\n      const show = !q || !!folderView.querySelector(\'.app-item:not([style*="display: none"]), details.dir-block:not([style*="display: none"])\');\n      folderView.style.display = show ? \'\' : \'none\';\n    }\n\n    Array.from(document.querySelectorAll(\'.sidebar-list li\')).forEach((li) => {\n      const href = li.querySelector(\'a\')?.getAttribute(\'href\');\n      if (!href || !href.startsWith(\'#\')) {\n        li.style.display = \'\';\n        return;\n      }\n      const target = document.querySelector(href);\n      li.style.display = (!q || isVisible(target)) ? \'\' : \'none\';\n    });\n\n    empty.style.display = q && visiblePaths.size === 0 ? \'block\' : \'none\';\n  }\n\n  updateChangedNotes();\n  input.addEventListener(\'input\', applySearch);\n})();'


# ---------------------------------------------------------------------------
# Rendering
# ---------------------------------------------------------------------------

def render_app_item(entry: FileEntry, recent_paths: set[str], show_path: bool = False) -> str:
    badge = '<span class="new-badge">RECENT</span>' if entry.rel_path in recent_paths else ""
    path_note = f'<span class="path-note">{esc(entry.rel_path)}</span>' if show_path else ""
    title = entry.title
    search_text = f"{title} {entry.name} {entry.rel_path} {entry.category} {entry.subcategory} {' '.join(entry.tags)}"
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
            '<div class="category-heading"><span class="icon">🕒</span><span>Recent Changes</span></div>'
            f'<p class="recent-empty">No files were added or changed in the last {recent_days} days.</p>'
            '</section>'
        )

    items = []
    for entry in recent:
        changed_abs = absolute_day_label(entry.mtime or 0)
        changed_epoch = entry.mtime or 0
        title = entry.title
        search_text = f"{title} {entry.name} {entry.rel_path} {entry.category} {entry.subcategory} {' '.join(entry.tags)}"
        items.append(
            f'<li class="app-item recent-item" data-path="{esc(entry.rel_path)}" data-search="{esc(search_text.casefold())}">'
            f'<a href="{esc(href_for(entry.rel_path))}" target="_blank" rel="noopener noreferrer">'
            f'<span class="icon">{esc(entry.icon)}</span><span class="app-title">{esc(title)}</span></a>'
            f'<span class="changed-note" data-changed-epoch="{changed_epoch:.3f}" title="Changed {esc(changed_abs)}">{esc(changed_abs)}</span>'
            '</li>'
        )

    return (
        '<section class="category-block recent-section searchable-category" id="recently-changed">'
        '<div class="category-heading"><span class="icon">🕒</span><span>Recent Changes</span></div>'
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
            items.sort(key=lambda item: item.title.casefold())

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

    if include_folder_view:
        links.append('<li><a href="#folder-view"><span class="icon">🗂</span>Folder View</a></li>')

    links.append(
        f'<li><a href="#recently-changed"><span class="icon">🕒</span>'
        f'Recent Changes <span class="muted">({recent_count})</span></a></li>'
    )

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


def render_folder_files(files: List[FileEntry], recent_paths: set[str]) -> str:
    files_sorted = sorted(files, key=lambda item: item.title.casefold())
    items = [render_app_item(entry, recent_paths, show_path=False) for entry in files_sorted]
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

    root_files_html = ""
    if tree.files:
        root_files_html = (
            '<details class="dir-block" open>'
            f'<summary><span class="icon">🏠</span>Root Files <span class="muted">({len(tree.files)})</span></summary>'
            f'<div class="nested">{render_folder_files(tree.files, recent_paths)}</div>'
            '</details>'
        )

    return (
        '<section class="category-block folder-view-section" id="folder-view">'
        '<div class="category-heading"><span class="icon">🗂</span><span>Repository Folder View</span></div>'
        '<p class="section-note">This maintenance view keeps the original folder structure, but the main list above is grouped by app purpose.</p>'
        + root_files_html
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
    generated_date_iso = now.date().isoformat()
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
{INDEX_CSS}
</style>
</head>
<body data-generated-date="{esc(generated_date_iso)}">
  <div class="page">
    <header class="hero">
      <h1>{esc(title)}</h1>
      <p class="index-summary">{esc(status)} · {esc(intro_text)}</p>
      <p class="ai-note">Apps were created with the use of AI. Please see my <a href="https://github.com/jwesters/" target="_blank" rel="noopener noreferrer">Github</a> for more info.<br>
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
          <a href="https://github.com/jwesters/" target="_blank" rel="noopener noreferrer">jwesters github repo</a>
        </div>
      </main>
    </div>
  </div>

<script>
{INDEX_JS}
</script>
</body>
</html>
'''


# ---------------------------------------------------------------------------
# Git dates, audit, and self-checks
# ---------------------------------------------------------------------------

def git_last_changed(root: Path) -> Dict[str, float]:
    """One Git invocation for last-committed dates; untracked files use mtime.

    Unlike filesystem timestamps, committed Git dates are not changed merely
    by extracting an archive or copying a directory. A newly renamed path
    gets its rename commit date after that commit is made.
    """
    try:
        proc = subprocess.run(
            ["git", "log", "--no-renames", "--format=__INDEX_COMMIT__%ct", "--name-only", "--", "."],
            cwd=root, capture_output=True, text=True, encoding="utf-8", errors="replace",
            timeout=45, check=False,
        )
    except (OSError, subprocess.TimeoutExpired):
        return {}
    if proc.returncode:
        return {}
    times: Dict[str, float] = {}
    stamp: float | None = None
    now = time.time()
    for raw in proc.stdout.splitlines():
        line = raw.strip()
        if line.startswith("__INDEX_COMMIT__"):
            try:
                stamp = min(float(line.split("__INDEX_COMMIT__", 1)[1]), now)
            except ValueError:
                stamp = None
        elif stamp is not None and line and not line.startswith("__INDEX_"):
            times.setdefault(normalize_path(line).casefold(), stamp)
    return times


def normalized_duplicate_title(title: str) -> str:
    return re.sub(r"[^a-z0-9]+", " ", title.casefold()).strip()


def audit_entries(root: Path, raw: Sequence[FileEntry], indexed: Sequence[FileEntry],
                  catalog: Catalog, recent_source: str) -> Dict[str, Any]:
    """Report questionable classifications; never auto-delete or move a file."""
    by_title: Dict[str, List[FileEntry]] = collections.defaultdict(list)
    counts: Dict[str, int] = collections.Counter()
    categories: Dict[str, Dict[str, int]] = collections.defaultdict(lambda: collections.Counter())
    for entry in raw:
        by_title[normalized_duplicate_title(entry.title)].append(entry)
        counts[entry.classification_source] += 1
    for entry in indexed:
        categories[entry.category][entry.subcategory] += 1

    duplicate_groups = []
    identical_groups = []
    for title, group in sorted(by_title.items()):
        if not title or len(group) <= 1:
            continue
        paths = sorted(e.rel_path for e in group)
        automatically_suppressed = title in DEDUPLICATE_DISPLAY_TITLES or any(e.canonical for e in group)
        duplicate_groups.append({"title": title, "paths": paths, "automatically_suppressed": automatically_suppressed})
        hashes: Dict[str, List[str]] = collections.defaultdict(list)
        for e in group:
            try:
                digest = hashlib.sha256((root / e.rel_path).read_bytes()).hexdigest()
                hashes[digest].append(e.rel_path)
            except OSError:
                continue
        for duplicate_paths in hashes.values():
            if len(duplicate_paths) > 1:
                identical_groups.append(sorted(duplicate_paths))

    indexed_paths = {e.rel_path.casefold() for e in indexed}
    unclassified = sorted(e.rel_path for e in indexed if e.category == "Other / Unsorted")
    fallback = sorted(e.rel_path for e in indexed if e.classification_source in ("legacy-keyword", "unclassified", "legacy-subject-test"))
    missing = sorted(e.rel_path for e in indexed if not (root / e.rel_path).is_file())
    all_scanned_paths = {e.rel_path.casefold() for e in raw}
    stale_metadata = sorted(path for path in catalog.apps if path not in all_scanned_paths)
    suppressed = sorted(e.rel_path for e in raw if e.rel_path.casefold() not in indexed_paths)
    warnings = []
    if unclassified:
        warnings.append(f"{len(unclassified)} unclassified app(s) need review")
    unexpected_duplicates = [g for g in duplicate_groups if not g["automatically_suppressed"]]
    if unexpected_duplicates:
        warnings.append(f"{len(unexpected_duplicates)} unresolved display-title group(s) need review")
    if missing:
        warnings.append(f"{len(missing)} indexed path(s) do not exist")
    if stale_metadata:
        warnings.append(f"{len(stale_metadata)} catalog app path(s) no longer exist")
    if fallback:
        warnings.append(f"{len(fallback)} app(s) use legacy classification rules (informational)")

    return {
        "generated": datetime.now().astimezone().isoformat(timespec="seconds"),
        "root": str(root),
        "recent_source": recent_source,
        "summary": {
            "scanned": len(raw), "indexed": len(indexed), "suppressed_known_duplicates": len(suppressed),
            "educational": sum(is_educational(e) for e in indexed),
            "unclassified": len(unclassified), "duplicate_title_groups": len(duplicate_groups),
            "unresolved_duplicate_title_groups": len(unexpected_duplicates),
            "identical_content_groups": len(identical_groups),
            "legacy_rules_used": len(fallback), "stale_catalog_paths": len(stale_metadata),
        },
        "category_counts": {cat: dict(sorted(subgroups.items())) for cat, subgroups in sorted(categories.items())},
        "classification_sources": dict(sorted(counts.items())),
        "warnings": warnings,
        "unclassified_paths": unclassified,
        "legacy_classified_paths": fallback,
        "duplicate_titles": duplicate_groups,
        "identical_content": identical_groups,
        "suppressed_duplicate_paths": suppressed,
        "missing_index_targets": missing,
        "stale_catalog_paths": stale_metadata,
    }


def write_audit(path: Path, report: Dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def print_audit(report: Dict[str, Any]) -> None:
    summary = report["summary"]
    print("\nINDEX AUDIT")
    print(f"  Apps indexed: {summary['indexed']} | Education: {summary['educational']}")
    print(f"  Unclassified: {summary['unclassified']} | Unresolved duplicate titles: {summary['unresolved_duplicate_title_groups']}")
    print(f"  Known duplicates hidden: {summary['suppressed_known_duplicates']} | Legacy fallback: {summary['legacy_rules_used']}")
    for warning in report["warnings"]:
        print(f"  Review: {warning}")


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
    parser.add_argument("--catalog", default="index_catalog.json", help="Optional per-app JSON metadata file, relative to --root.")
    parser.add_argument("--no-catalog", action="store_true", help="Ignore the optional catalog file.")
    parser.add_argument("--audit-out", default="index_audit.json", help="JSON organization audit report, relative to --root.")
    parser.add_argument("--no-audit", action="store_true", help="Do not write the JSON audit report.")
    parser.add_argument("--audit-only", action="store_true", help="Generate the audit without writing either HTML index.")
    parser.add_argument("--strict-audit", action="store_true", help="Exit with status 2 for unclassified, missing, or duplicate-title apps.")
    parser.add_argument("--recent-source", choices=("filesystem", "git"), default="filesystem",
                        help="Recent Changes timestamps: filesystem (default) or last Git commit per path.")
    parser.add_argument("--prefer-page-titles", action="store_true", help="Use short HTML <title> text for non-index pages where available.")

    args = parser.parse_args()

    root = Path(args.root).expanduser().resolve()
    if not root.exists() or not root.is_dir():
        raise SystemExit(f"Root folder does not exist or is not a directory: {root}")

    catalog_path = None if args.no_catalog else (root / args.catalog)
    try:
        catalog = load_catalog(catalog_path)
    except ValueError as error:
        parser.error(str(error))
    if catalog.source:
        print(f"Using catalog: {catalog.source}")

    raw_entries = scan_files(
        root=root,
        exts=args.ext,
        exclude_dirs=args.exclude_dir,
        include_root_files=args.include_root_files,
        hide_root_index_html=args.hide_root_index_html,
        hide_all_index_html=args.hide_all_index_html,
        hide_nsfw_anywhere=args.hide_nsfw,
        catalog=catalog,
        recent_source=args.recent_source,
        return_raw=True,
        prefer_page_titles=args.prefer_page_titles,
    )
    entries = deduplicate_entries(raw_entries)
    # Preserve stable category > subcategory > title ordering after deduplication.
    category_rank = {category: n for n, category in enumerate(CATEGORY_ORDER)}
    entries.sort(key=lambda e: (category_rank.get(e.category, 999), e.subcategory.casefold(),
                                e.title.casefold(), e.rel_path.casefold()))
    audit = audit_entries(root, raw_entries, entries, catalog, args.recent_source)
    print_audit(audit)
    if not args.no_audit:
        write_audit(root / args.audit_out, audit)
        print(f"Wrote audit: {root / args.audit_out}")
    if args.audit_only:
        return 2 if args.strict_audit and (audit["summary"]["unclassified"] or
                  audit["summary"]["unresolved_duplicate_title_groups"] or audit["summary"]["stale_catalog_paths"] or
                  audit["missing_index_targets"]) else 0

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

    if args.strict_audit and (audit["summary"]["unclassified"] or
                              audit["summary"]["unresolved_duplicate_title_groups"] or
                              audit["summary"]["stale_catalog_paths"] or
                              audit["missing_index_targets"]):
        return 2
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

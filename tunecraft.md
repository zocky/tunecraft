# Tunecraft Syntax

## Code samples
### Basic
````
[ C | c d e f g a b +c | 1 2 3 4 5 6 +7 ]

// plays the major scale of eights starting from c4, twice.
````
### Intermediate
````
$scale = 1 (2 3) 4 (5 6)
[ C | $scale | D | $scale ]

// Plays the first six notes of the major scale in C, then in D
// both times in a 1/4 1/8 1/8 1/4 1/8 1/8 pattern
````
### Advanced
````
  $pattern = 1 3 5 3 1 3 5 3
  $part =[ 
    | C
    | I $pattern
    | II $pattern
    | IV $pattern
    | V $pattern
  ]

  ["acoustic_grand_piano" V100|[$part]]

  {
    $chord = 1 & 3 & 5
    $pattern = ($chord $chord) $chord
    ["rock_organ" V50|[$part]]
  }
````


## Cheat Sheet

### Statements (outside bars)

| Syntax | Name | Description |
| --- | --- | ---  |
|`@track "name" instrument`|Track definition|Define and name a track. You can use the name to set the current track in bars statements.
|`[ X \| X ]`|Bars| Send notes to a track. Separate bars with `\|`. Each bar will last one measure, according to the current time signature and tempo. Consecutive bars statements will play simultenously.
|`$name = X`|Macro definition|Define a macro. X can be a sequence of notes, or one bars statement, or a scope, if you need to do something more complicated, like using local submacros or send notes to several tracks.
|`{ }`|Macro scope|Macros defined within this scope will be valid within this scope and within any macro that you expand in this scope. You can use this to avoid name clashes between your macros, or to send parameters to your macros.

### Expressions (within bars)

#### Notes, chords, sequences

| Syntax | Name | Description |
| --- | --- | ---  |
| `a - g` | Named note | Corresponds to staff lines in the current scale. Stays within the key's octave, `c` is always lower than `b`. Takes up one share of time.
| `1 - 7` | Numbered note | 1 is the root note of the current scale, depending on the key, mode and any scale shift. 2-7 are other notes in the scale above 1. 1 is always lower than 7. Takes up one share of time.
| `$name` | Macro expansion | Expand the specified macro using the current macro scope. Takes up one share of time.
| `X# Xb` | Sharp / Flat | Raises or lowers the pitch of `X` by one half-tone. Applies to notes, keys, groups, scale shifts, macro expansions. Can be repeated.
| `+X -X` | Octave shift | Raises or lowers the pitch of `X` by one octave. Applies to notes, keys, groups, scale shifts, macro expansions. Can be repeated.
| `X:` | Double length | Double the length of `X`. Applies to notes, groups, macro expansions. Can be repeated.
| `X'` | Half length | Halve the length of `X`. Applies to notes, groups, macro expansions. Can be repeated.
| `X.` | Dotted length | Increase the length of  `X` by 50%. Applies to notes, groups, macro expansions. Can be repeated to add 25%, 12.5% etc.
| `X & Y & Z ...`| Polyphony | Play notes, groups and macro expansions at the same time. Each item can be modified with any of `: ' .` to change the number of shares it takes up in the parent measure or group. Takes up as many share of time as the longest item.
| `X Y Z ...`| Sequence | Play chords, notes, groups and macro expansions in sequence, with each item taking up one share of time. Each item can be modified with any of `: ' .' to change the number of shares it takes up.
| ` ;` | Subdivision | Divide the length of the sequence into equal parts.
| `( )` | Group | Group a sequence to take up one share of time. Can be modified with any of `: ' . # b + -`

#### Keys, modes, scales

| Syntax | Name | Description |
| --- | --- | ---  |
|`A - G`|Key|Sets the root note of the current key. Can be modified with any of`# b + -`. Sets the current mode to I unless other mode is specified.
|`I - VII`|Scale shift|Sets the root note of the current scale to the nth note of the current key/mode. Can be modified with any of`+ -`. Unless a mode is explicitly specified, the mode of the scale will be set so that it stays in the current key/mode.
|`X(I) - X(VII)`|Mode|Sets the mode of the current scale. Applies to keys and scale shifts. 
|`Xm`|Minor mode|Shortcut for `(VI)`.

#### Meta

| Syntax | Name | Description |
| --- | --- | ---  |
|`"track"`|Track|Set the current track. Tracks can be predefined with `@track`. If you use a valid name of a midi instrument for track name, a track with that instrument will be automatically created. Any notes that are output without a specified track will go to the `default` track.
|`N/M`|Time signature|Set the time signature. M must be a power of 2.
|`Tnnn`|Tempo|Set tempo to `nnn` BPM. Affects all tracks.
|`Vnnn`|Volume|Set note velocity to `nnn`.

#### Whitespace and comments
Wherever whitspace is required, e.g. between notes in a sequence, e.g. before and after `[ | ] ( ) ; & =` or between statents, you can use any amount of whitespace characters (spaces, tabs and newlines). Additionally, you can use line and block comments which will be treated just like whitespace.

| Syntax | Name | Description |
| --- | --- | ---  |
|`//`|Line comment|Ignores all the text until the end of the line
|`/* */`|Block comment|Ignores all the text within the block

## Getting started
To play some notes, put them in square brackets `[]`and press **play**.
````
[ c d e f ]
````

To play more than one measure of music, separate measures with a pipe `|`

````
[ c d e f | g a]
````
Whitespace and empty measures are ignored, so you can use newlines and indenting at your convinience. 

````
[ 
| c d e f 
| g a
]
````
To add a pause, use `p` or `0`. To add a silent measure, put a pause in it.
````
[ c d e p |  p  | f g ]
````

Notes correspond to staff lines. If you change the key, correct accidentals (sharps and flats)
will be applied. In this example, the actual notes will be c#, d#, e, f#. Note that notes are written with lowercase letters and keys with uppercase letters.

````
[Dm | c d e f] 
````

## Notes
### Named notes: `c d e f g a b`
Named notes correspond to staff lines. If you change the key and/or mode (see Keys and Scales below) from the default C major, correct accidentals (sharps and flats) will be applied. 
````
[C c d e f | Dm c d e f] 
````
The above example will play  `c d e f  |  c# d# e f#`. 

Named notes are handy for transcribing sheet music, but when composing, you will progably
find numbered notes more useful.

### Numbered notes: `1 2 3 4 5 6 7`
Numbered notes correspond to the current scale (see Keys and Scales below). If you change the key and/or mode (see below) from the default C major, the 1 note will be the root note of the key.
````
[C 1 2 3 4 | Dm 1 2 3 4] 
````
The above example will play   `c d e f  |  d# e f# g#`. 

### Accidentals: `# b`
Any note, named or numbered, can be followed by an accidental, possibly repeated. Each `#` will raise the pitch by on half-step, and each `b` will lower it by one half-step.

````
[e fb d##] 
````
**Note:** Accidentals are applied to named notes even if the node already has an accidental. This means that in the key of Dm, `c#` will be sharpened twice. This is different from standard sheet music notation.

### Octave shift: `- +`
Any note, named or numbered, can be preceded by one or more pluses or minuses. Each `+` will raise the pitch by one octave, and each `-` will lower it by one octave.

````
[ D -4 -5 -6 -7 | 1 2 3 4 | 5 6 7 +1 ] 
````
Will play the D major scale from low G to high D.

## Note lengths
By default, all notes in a measure will take up the same amount of time.
````
[ 1 1 1 1 | 1 1 ] 
````
In the default 4/4 time signature (see Time Signature and Tempo below for how to change it), this
will give us four quarters in the first measure and 2 half-notes in the second. You can use the additional constructs below to change how the measure is divided between notes.

### Grouping `()`
You can use brackets `()` to group notes. Each group takes up one share of time, i.e. the same as an ungrouped note.

````
[ (1 1) 1 | (1 1 1) 1 ]
````
Will play `1/4 1/4 1/2 | 1/6 1/6 1/6 1/2`

Will play two quarters followed by a half-note in the first measure. In the second, we will get a triole of 1/6 notes and a half note.

Groups can contain other length operators. See below for examples.

### Subdivision `;`
You can use semicolons to divide the measure into equal parts, with notes between semicolons spliting the time between them.

````
[ 1 1 ; 1 ] 
````
Will play `1/4 1/4 1/2`

Semicolons work inside brackets as well:
````
[ (1 ; 1 1) 1 ] 
````
Will play `1/4 1/8 1/8 1/2`


### Double and half length `: '`
You can use one or more colons `:` or one or more single quotes `'` after the note to double or halve the length of a note.

````
[ 1 1 1: | 1' 1' 1 ] 
````

Will play `1/4 1/4 1/2 | 1/4 1/4 1/2`

Double and half length works inside brackets, and can also be applied to bracketed groups:

````
[ (1 2: 1) 2 (3 4)' 5' 6] 
````

Will play `1/16 1/8 1/16 1/4 1/16 1/16 1/8 1/4`. Of course, we could rewrite the above to the more readable:
````
[ 1 2: 1 ; 2 ; (3 4) 5 ; 6 ] 
````
### Dotted notes `.`
You can add one or more dots `.` after the note (and any doubling/halving operators) to prolong the note. One dot adds 50%, two add 75%, three add 87.5% etc.

This is especially useful in conjunction with the length halving operator:

````
[ 1' 2. | 1.. 2''] 
````
Will play `1/4 3/4 | 7/8 1/8`.

Again, this can be used within bracketed groups and applied to bracketed groups:
````
[ (1. 2') 3 | (1 2)' 3. ] 
````
Will play `1/8 3/8 1/2 | 1/8 1/8 3/4`.


## Keys and scales
You can change the key and/or the mode at any point in the measure. The new key will apply until it is changed again.

### Key `C Cm C# C#m ...`
Must use a capital letter from C-B. Changes the key. Addin the `m` sets the mode to VI, i.e. natural minor. See below for more options.

From this point on:

Named notes will automatically have accidentals appropriate to the key. 
````
[ C c d e f | Dm c d e f ]

// c d e f | c# d# e f#
````
Numbered notes will begin at the root note and follow the scale:
````
[ C 1 2 3 4 | Dm 1 2 3 4 ]

// c d e f | d# e f# g#
````
Named notes will stay within the octave of the key, numbered notes will be related to the root note:
````
[ Am a b c d | 1 2 3 4 | a b +c +d | 1 2 +3 +4 ]

// a4 b4 c4 d4 | a4 b4 c5 d5 | a4 b4 c5 d5 | a4 b4 c6 d6
````
A key change does not affect timing:

````
[ 1 2 Cm 3 4 | Dm | 1 2 3 4 ]

// the first measure has 1/4 notes, not 1/5
// the second measure takes up no time, so it's skipped
````

### Octave shift `+ -`
You can change the root octave of the key by preceeding it with the appropriate number of pluses or minuses.
````
[ C 1 2 3 4 | -C 1 2 ++C 3 4 ]

// c4 d4 e4 f4 | c3 d3 e6 f6 
````

### Mode `m (I) (II) (III) (IV) (V) (VI) (VII)`

You can follow the key with a mode number in uppercase Roman numerals in brackets, or lowercase `m`, which is a shortcut for `(VI)`. The default is `(I)` is the Ionian mode, `(II)` is the Dorian, etc. `(VI)` is the Aeolian mode, which is the natural minor scale. If not specified, `(I)`, i.e. the natural major scale will be used.

The mode will affect both named and numbered notes:

````
[ C 1 2 3 4 | C(II) 1 2 3 4 | Cm 1 2 3 4]

// c d e f | c d eb f
// the second measure is in Dorian
````

### Scale shift `I II III IV V VI VII`
You can change the root note of the scale without changing the key. This will not affect named notes. Numbered notes will be shifted by the specified number but stay in the key. 

````
[ C 1 2 3 4 | II 1 2 3 4 | III 1 2 3 4 | I 1 2 3 4]

// c d e f | d e f g | f g a b | c d e f

````

You can use pluses and minuses to shift octaves.
````
[ C | VI 1 2 3 4 | -VI 1 2 3 4 ]

// a4 b4 c5 d5 | a3 b3 c4 d4 
````

This is especially useful for chord progressions. Playing the same triad with different scale shifts will give you the correct diatonic chords for your key:

````
[ C
| I 1 & 3 & 5
| II 1 & 3 & 5
| VI 1 & 3 & 5
| V 1 & 3 & 5
]
// C major | D minor | A minor | G major
````

This will also work in minor keys:


````
[ Bm
| I 1 & 3 & 5
| II 1 & 3 & 5
| V 1 & 3 & 5
| I 1 & 3 & 5
]
// B minor | C# diminished | F# major | B minor
````

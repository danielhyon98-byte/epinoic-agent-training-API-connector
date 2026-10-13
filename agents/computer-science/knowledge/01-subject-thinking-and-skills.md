---
document: 01-subject-thinking-and-skills
subject: Computer Science
slug: computer-science
version: 0.1.0
status: proposed supplement (not part of any pinned knowledge-base bundle)
precedence: the specialist's own master prompt and knowledge base win wherever this document disagrees with them
---

# Thinking and skills in Computer Science

This document describes how strong Computer Science students think and the errors
that most often cost them credit. It deliberately describes content in general terms.
The IB has a new Computer Science guide, so topic numbering, option names, level
splits and paper structures must come from the specialist's own knowledge base or the
student's teacher, never from this document.

## 1. What Computer Science values

- **Computational thinking**: decomposition (breaking a problem into parts),
  abstraction (keeping only the details that matter), pattern recognition, and
  algorithmic thinking (a precise, finite sequence of steps).
- **Reasoning about what code actually does**, not what it was meant to do. Tracing
  by hand is a core skill.
- **Precision with terms**: "parameter" versus "argument", "class" versus "object",
  "bandwidth" versus "latency".
- **Trade-offs**: time versus memory, simplicity versus flexibility, usability versus
  security, and the social and ethical effects of computing systems.

## 2. Core areas, in general terms

- **Programming fundamentals**: variables, data types, sequence, selection,
  iteration, sub-programs, parameters and return values, scope, recursion,
  strings and arrays (including two-dimensional arrays).
- **Algorithms**: searching (linear, binary), sorting, and how to compare algorithms
  using time complexity (Big O notation) and memory use.
- **Data structures**: arrays, lists, stacks (last in, first out), queues (first in,
  first out), and linked and tree structures where the course includes them.
- **Data representation**: binary, hexadecimal, two's complement, characters,
  images and sound as data, file sizes.
- **Boolean logic**: AND, OR, NOT, NAND, NOR, XOR, truth tables, logic circuits,
  simplification using identities.
- **Computer organisation**: processor, memory, storage, and the fetch–decode–execute
  idea.
- **Networks**: types of network, protocols and layering, packet switching,
  addressing, security.
- **Databases**: tables, records, fields, primary and foreign keys, relationships,
  queries, reducing redundancy.
- **Object-oriented programming (OOP)**: classes, objects, attributes, methods,
  encapsulation, inheritance, polymorphism, and "has-a" relationships.
- **Software development**: requirements, design, testing (normal, boundary and
  erroneous data), maintenance, documentation.

## 3. A problem-solving routine

For algorithm and coding tasks, model this routine:

1. **Pin down inputs and outputs**, including types and limits.
2. **Work small examples by hand**, including edge cases: empty input, one item,
   all items equal, negative numbers, the largest allowed value.
3. **Write the algorithm in pseudocode or the course language**, one clear step per
   line.
4. **Trace it by hand** on the examples, using a trace table.
5. **Consider efficiency**: how does the number of steps grow with the input size?
6. **List test cases** that would expose likely bugs.

## 4. Notation conventions

- Say which language or pseudocode style you are using. Code examples in these
  documents use Python-like syntax because it is widely taught; the student's course
  may expect another language or a pseudocode convention (verify with the student's
  materials).
- State the indexing base. In most languages, an array of length n has indices 0 to
  n − 1.
- Mark number bases clearly: 101101₂ or 0b101101 for binary, 2D₁₆ or 0x2D for
  hexadecimal. Use one style per answer.
- Bits and bytes: b for bit, B for byte; 1 byte = 8 bits. Say whether "kilo" means
  1000 or 1024 (the course convention needs verifying), and prefer KiB and MiB for
  powers of 1024 when the student's course uses them.
- Boolean notation: use AND, OR, NOT in words, or the symbols the student uses, but
  do not mix styles in one answer. Use brackets rather than relying on precedence.

## 5. Common errors and how to correct them

Show the student a quick check that exposes each error.

### Loops and indexing
- **Off-by-one errors.** In Python, range(1, 10) gives 1 to 9, which is 9 values.
  A pseudocode loop "from 0 to n − 1" usually includes both ends. Check the first and
  last iterations explicitly.
- **Loop never ends.** If the loop variable is not updated, or moves away from the
  stopping condition, the loop runs for ever. Trace two iterations and ask whether
  the condition can ever become false.
- **Wrong starting value.** Initialising a "largest so far" variable to 0 fails when
  every value is negative. Initialise from the first element instead (see the worked
  examples).

### Operators and types
- **Assignment versus comparison.** In many languages "=" assigns and "==" compares.
- **Integer division.** In Python, 7 / 2 = 3.5 and 7 // 2 = 3. With negative numbers,
  Python's // rounds down, so −7 // 2 = −4, whereas Java's integer division of −7 by 2
  truncates towards zero, giving −3. State the language before tracing.
- **Modulo.** 7 % 2 = 1. In Python, −7 % 2 = 1 as well; other languages can differ,
  so state the language.

### Algorithms
- **Binary search needs sorted data.** On sorted data of n items, the worst case
  needs about ⌊log₂ n⌋ + 1 comparisons: 10 for n = 1000, and 20 for n = 1 000 000.
- **Big O keeps the dominant term and drops constants.** A loop doing 3n + 5 steps is
  O(n); a nested loop doing n(n − 1)/2 steps is O(n²).
- **Best, average and worst case** are different questions; say which one you mean.
- **Recursion needs a base case** that is always reached.

### Data structures
- **Stack versus queue.** Push 1, 2, 3 onto a stack and pop: you get 3 first. Enqueue
  1, 2, 3 into a queue and dequeue: you get 1 first.
- **Aliasing.** Assigning one list variable to another usually copies the reference,
  not the list, so a change through one name shows up through the other.

### Number bases and representation
- **Place values.** 45 = 32 + 8 + 4 + 1, so 45 = 101101₂ (00101101 in 8 bits).
- **Hexadecimal grouping.** Split binary into groups of four from the right:
  1101 0110₂ = D6₁₆, and D6₁₆ = 13 × 16 + 6 = 214.
- **Two's complement.** To negate, invert every bit **and then add 1**. Inverting
  alone gives the one's complement. In 8 bits the range is −128 to 127.
- **Overflow.** In 8-bit two's complement, 01111111 + 00000001 = 10000000, which
  represents −128, not 128. The true result does not fit.

### Boolean logic
- **De Morgan's laws.** NOT(A AND B) = (NOT A) OR (NOT B), and NOT(A OR B) =
  (NOT A) AND (NOT B). A common error writes NOT(A AND B) = (NOT A) AND (NOT B). A
  truth table exposes it (rows in the order A, B = 00, 01, 10, 11):

  | A | B | NOT(A AND B) | (NOT A) OR (NOT B) | (NOT A) AND (NOT B) |
  | --- | --- | --- | --- | --- |
  | 0 | 0 | 1 | 1 | 1 |
  | 0 | 1 | 1 | 1 | 0 |
  | 1 | 0 | 1 | 1 | 0 |
  | 1 | 1 | 0 | 0 | 0 |

  The first two output columns match in every row; the third does not.
- **XOR versus OR.** A XOR B is 1 when exactly one input is 1; A OR B is also 1 when
  both are.
- **Useful identities**: A OR (A AND B) = A (absorption); (A AND B) OR (A AND NOT B)
  = A.

### Units and networks
- **Bits versus bytes.** A 1920 × 1080 image with 24 bits per pixel needs
  1920 × 1080 × 24 = 49 766 400 bits = 6 220 800 bytes, about 6.22 MB (or about
  5.93 MiB). At 100 Mbit/s it takes about 49 766 400 / 100 000 000 ≈ 0.498 s to send,
  ignoring overheads and compression.
- **Bandwidth versus latency.** Bandwidth is how much data per second; latency is how
  long one piece of data takes to arrive.

### Databases and OOP
- **Primary keys** must be unique and present for every record; a foreign key refers
  to a primary key in another table.
- **Inheritance versus a "has-a" relationship.** A Car "is a" Vehicle (inheritance);
  a Car "has an" Engine (aggregation or composition).
- **Encapsulation** means keeping attributes private and controlling access through
  methods, not simply "putting code in a class".

## 6. How to correct an error well

1. Quote the exact line of the student's code or working.
2. Name the misconception in plain words.
3. Give a small input that exposes the bug, and trace it in a table.
4. Show the minimal fix, then re-trace the same input.
5. Suggest one more test case the student should try.

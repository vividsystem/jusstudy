# Jus'STUDY
A study focused [YSWS](https://ysws.hackclub.com/)



## How it works
1. A user creates a project
it then ties hackatime projects to the jusstudy project
-> hackatime tracks time
2. user submits "a ship"
-> version submitted gets reviewed, if denied the user has the option to reship, otherwise:
3. voting
This YSWS uses [Weng-Ling Baysian Ranking (similar to TrueSkill but faster)](https://www.csie.ntu.edu.tw/~cjlin/papers/online_ranking/online_journal.pdf) to rank projects.
after enough votes a project then receives a coin multiplier based on quality
4. reship...

## Setup
see [SETUP.md](./SETUP.md)

## Acknowledgments
This is built upon the [bhvr](https://bhvr.dev) stack. <br/>
It intern is built upon [bun](https://bun.sh), [hono](https://hono.dev), [vite](https://vitejs.dev) and [react](https://react.dev).
The project also uses [drizzle](https://orm.drizzle.team/) as an orm and [better-auth](https://better-auth.com/) together with hackclub-auth to provide auth.
For now this project also uses [openskill's ranking implementation](https://github.com/philihp/openskill.js)
This project also uses [spaces](https://github.com/vividsystem/spaces), a simple to use file storing service I made myself. It is in early development and it's also my first project in Rust.

## AI Disclosure
This project is not vibe-coded. However I decided to make a part of the review-panel's UI using AI.

## LICENSE
To see how this project is licensed see [LICENSE](,/LICENSE).
The license extends to all the code but not to the image of the staff signatures.

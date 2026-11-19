# Canva art queue for Cipher Path

Generate one item per visit (Canva allows about one image per cooldown). Always pass the mascot as the style
reference: `imageReferences: [{type: "MEDIA", id: "MAHbZEktWOY"}]`, aspect ratio `SQUARE_1_1`.
Save the tool-result PNG here under the file name given, run `bash scripts/build.sh`, sync, test, commit, push, republish.
Mark the item done below. Boss sheets are 2x2 grids (top-left, top-right, bottom-left, bottom-right) cut by `build_cp.py`.

Common style line for every prompt: "cute funny 3D cartoon, same style as the reference dragon mascot, deep lacquer-red background, no text".

| # | File | Prompt subject | Done |
|---|---|---|---|
| 1 | longbao_happy.png | Mascot hugging a laptop (reference image) | ✓ |
| 2 | longbao_win.png | Mascot jumping, confetti and firecrackers | ✓ |
| 3 | bossgrid_se-fund__se-ds__se-algo__se-oop.png | 2x2: white ghost made of question marks · tangled purple octopus juggling numbered blocks · dizzy blue spiral whirlwind demon · grumpy stone giant with a crown of code brackets | ✓ |
| 4 | bossgrid_se-pat__se-git__se-test__se-web.png | 2x2: monster made of tangled spaghetti noodles · two-headed dragon whose heads argue (merge conflict) · see-through phantom ladybug · fiery beast bursting out of a smoking server rack | ✓ |
| 5 | bossgrid_se-db__se-sys__se-ops__se-agile.png | 2x2: sleepy sloth hugging a slow database cylinder · giant pagoda tower balanced on one tiny pillar · cheeky imp hugging a laptop with a "works on my machine" grin · sly orange fox carrying a growing stack of sticky notes | ✓ |
| 6 | bossgrid_cy-found__cy-crypto__cy-iam__cy-net.png | 2x2: rat holding a key labelled 123456 shape (no text) · fat toad with an open unlocked padlock · monkey grabbing a bunch of golden keys · crab with ports/sockets on its shell, claws open | ✓ |
| 7 | bossgrid_cy-web__cy-code__cy-threat__cy-soc.png | 2x2: green viper coiled around a syringe · bat with a key stuck to its wing · old shark holding a fishing rod with an email envelope hook · mosquito ringing a big alarm bell | |
| 8 | bossgrid_cy-ir__cy-cloud__cy-grc__cy-eh.png | 2x2: horned demon king holding a chained padlock over files · ogre sitting in an open bucket spilling papers · Chinese taotie beast munching stacks of paper scrolls · ninja sneaking past a dashed boundary line | |
| 9 | longbao_sad.png | Mascot sitting, tiny tear, laptop showing a red error screen with a smoke puff | |
| 10 | longbao_cool.png | Mascot with black sunglasses, arms crossed, gold shield beside him | |

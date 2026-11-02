'use strict';
/* ============================================================
   DATA — vocabulary by level.
   One entry per line:  word|reading|meaning
   An empty reading means the word is written in kana and is its own reading.
   JLPT has published no official word lists since 2010, so levels follow
   the commonly used community lists and are approximate.
   ============================================================ */

const LEVEL_INFO = [
  { id: 'kana', tag: 'かな', name: 'かな', en: 'Kana', mult: 1.0 },
  { id: 'N5', tag: 'N5', name: '入門', en: 'Beginner', mult: 1.0 },
  { id: 'N4', tag: 'N4', name: '初級', en: 'Elementary', mult: 1.2 },
  { id: 'N3', tag: 'N3', name: '中級', en: 'Intermediate', mult: 1.4 },
  { id: 'N2', tag: 'N2', name: '中上級', en: 'Upper-intermediate', mult: 1.6 },
  { id: 'N1', tag: 'N1', name: '上級', en: 'Advanced', mult: 1.8 },
];

const VOCAB_RAW = {
kana: `
いぬ||dog
ねこ||cat
さかな||fish
とり||bird
うま||horse
さくら||cherry blossom
すし||sushi
そば||soba noodles
みそ||miso
おちゃ||green tea
ごはん||rice; meal
ありがとう||thank you
おはよう||good morning
こんにちは||hello
こんばんは||good evening
さようなら||goodbye
すみません||excuse me; sorry
おやすみ||good night
いただきます||said before eating
ごちそうさま||thanks for the meal
はい||yes
いいえ||no
これ||this
それ||that
あれ||that (over there)
どこ||where
だれ||who
なに||what
いつ||when
いくら||how much
とても||very
ちょっと||a little
もっと||more
ゆっくり||slowly
いっしょに||together
たくさん||a lot
きれい||pretty; clean
かわいい||cute
おいしい||delicious
たのしい||fun
うれしい||glad; happy
すごい||amazing
げんき||healthy; energetic
ひらがな||hiragana
かたかな||katakana
きっぷ||ticket
しゅくだい||homework
りょこう||travel
テレビ||television
ラジオ||radio
カメラ||camera
パン||bread
コーヒー||coffee
ジュース||juice
ケーキ||cake
アイス||ice cream
レストラン||restaurant
ホテル||hotel
デパート||department store
コンビニ||convenience store
スーパー||supermarket
バス||bus
タクシー||taxi
トイレ||toilet
シャワー||shower
ベッド||bed
ドア||door
テーブル||table
パソコン||personal computer
スマホ||smartphone
ゲーム||game
サッカー||soccer
テニス||tennis
ピアノ||piano
ギター||guitar
ノート||notebook
ボールペン||ballpoint pen
シャツ||shirt
スカート||skirt
メール||email
インターネット||internet
アニメ||anime
チョコレート||chocolate
ハンバーガー||hamburger
パーティー||party
ニュース||news
メニュー||menu
チケット||ticket
エレベーター||elevator
コンピューター||computer
フォーク||fork
ナイフ||knife
スプーン||spoon
ファイル||file
ソファ||sofa
チェック||check
カレー||curry
ラーメン||ramen
アメリカ||America
イギリス||the UK
フランス||France
ベトナム||Vietnam
インドネシア||Indonesia
ブラジル||Brazil
`,

N5: `
学校|がっこう|school
先生|せんせい|teacher
学生|がくせい|student
大学|だいがく|university
友達|ともだち|friend
日本|にほん|Japan
日本語|にほんご|Japanese (language)
英語|えいご|English (language)
今日|きょう|today
明日|あした|tomorrow
昨日|きのう|yesterday
毎日|まいにち|every day
毎朝|まいあさ|every morning
今週|こんしゅう|this week
先週|せんしゅう|last week
来週|らいしゅう|next week
今年|ことし|this year
去年|きょねん|last year
来年|らいねん|next year
時間|じかん|time; hours
時計|とけい|clock; watch
午前|ごぜん|morning; a.m.
午後|ごご|afternoon; p.m.
天気|てんき|weather
元気|げんき|healthy; energetic
電気|でんき|electricity; light
電車|でんしゃ|train
電話|でんわ|telephone
自転車|じてんしゃ|bicycle
自動車|じどうしゃ|automobile
車|くるま|car
駅|えき|station
道|みち|road; way
銀行|ぎんこう|bank
病院|びょういん|hospital
会社|かいしゃ|company
会社員|かいしゃいん|office worker
図書館|としょかん|library
映画|えいが|movie
音楽|おんがく|music
写真|しゃしん|photograph
新聞|しんぶん|newspaper
雑誌|ざっし|magazine
手紙|てがみ|letter
切手|きって|postage stamp
辞書|じしょ|dictionary
鉛筆|えんぴつ|pencil
部屋|へや|room
家族|かぞく|family
両親|りょうしん|parents
兄弟|きょうだい|siblings
父|ちち|(my) father
母|はは|(my) mother
兄|あに|(my) older brother
姉|あね|(my) older sister
弟|おとうと|younger brother
妹|いもうと|younger sister
子供|こども|child
大人|おとな|adult
男の子|おとこのこ|boy
女の子|おんなのこ|girl
外国|がいこく|foreign country
外国人|がいこくじん|foreigner
山|やま|mountain
川|かわ|river
海|うみ|sea
空|そら|sky
雨|あめ|rain
雪|ゆき|snow
花|はな|flower
水|みず|water
魚|さかな|fish
肉|にく|meat
野菜|やさい|vegetable
果物|くだもの|fruit
牛乳|ぎゅうにゅう|milk
お茶|おちゃ|(green) tea
朝ご飯|あさごはん|breakfast
晩ご飯|ばんごはん|dinner
食べ物|たべもの|food
飲み物|のみもの|drink
買い物|かいもの|shopping
料理|りょうり|cooking; cuisine
旅行|りょこう|trip; travel
勉強|べんきょう|study
宿題|しゅくだい|homework
質問|しつもん|question
問題|もんだい|problem; question
漢字|かんじ|kanji
言葉|ことば|word; language
名前|なまえ|name
誕生日|たんじょうび|birthday
休み|やすみ|rest; holiday
仕事|しごと|work; job
春|はる|spring
夏|なつ|summer
秋|あき|autumn
冬|ふゆ|winter
朝|あさ|morning
夜|よる|night
夕方|ゆうがた|evening
半分|はんぶん|half
左|ひだり|left
右|みぎ|right
上|うえ|above; up
下|した|below; down
前|まえ|front; before
後ろ|うしろ|behind
外|そと|outside
中|なか|inside
東|ひがし|east
西|にし|west
南|みなみ|south
北|きた|north
目|め|eye
耳|みみ|ear
口|くち|mouth
手|て|hand
足|あし|foot; leg
頭|あたま|head
顔|かお|face
病気|びょうき|illness
薬|くすり|medicine
お金|おかね|money
動物|どうぶつ|animal
犬|いぬ|dog
猫|ねこ|cat
大きい|おおきい|big
小さい|ちいさい|small
新しい|あたらしい|new
古い|ふるい|old (not new)
高い|たかい|tall; expensive
安い|やすい|cheap
長い|ながい|long
短い|みじかい|short
暑い|あつい|hot (weather)
寒い|さむい|cold (weather)
白い|しろい|white
黒い|くろい|black
赤い|あかい|red
青い|あおい|blue
楽しい|たのしい|fun; enjoyable
難しい|むずかしい|difficult
忙しい|いそがしい|busy
面白い|おもしろい|interesting
有名|ゆうめい|famous
大切|たいせつ|important; precious
大丈夫|だいじょうぶ|all right; OK
上手|じょうず|skillful
下手|へた|unskillful
好き|すき|liked; favorite
便利|べんり|convenient
静か|しずか|quiet
食べる|たべる|to eat
飲む|のむ|to drink
見る|みる|to see; to watch
聞く|きく|to listen; to ask
読む|よむ|to read
書く|かく|to write
話す|はなす|to speak
行く|いく|to go
来る|くる|to come
帰る|かえる|to go home
歩く|あるく|to walk
泳ぐ|およぐ|to swim
買う|かう|to buy
休む|やすむ|to rest
起きる|おきる|to get up
寝る|ねる|to sleep
働く|はたらく|to work
教える|おしえる|to teach
習う|ならう|to learn
覚える|おぼえる|to memorize
忘れる|わすれる|to forget
入る|はいる|to enter
出る|でる|to go out; to leave
待つ|まつ|to wait
住む|すむ|to live (reside)
使う|つかう|to use
作る|つくる|to make
立つ|たつ|to stand
座る|すわる|to sit
一人|ひとり|one person; alone
二人|ふたり|two people
三つ|みっつ|three (things)
九つ|ここのつ|nine (things)
`,

N4: `
会議|かいぎ|meeting
意見|いけん|opinion
経験|けいけん|experience
説明|せつめい|explanation
準備|じゅんび|preparation
予定|よてい|plan; schedule
予約|よやく|reservation
約束|やくそく|promise
連絡|れんらく|contact
相談|そうだん|consultation
研究|けんきゅう|research
試験|しけん|exam
授業|じゅぎょう|class; lesson
教室|きょうしつ|classroom
教育|きょういく|education
文化|ぶんか|culture
文学|ぶんがく|literature
歴史|れきし|history
地理|ちり|geography
科学|かがく|science
数学|すうがく|mathematics
世界|せかい|world
社会|しゃかい|society
政治|せいじ|politics
経済|けいざい|economy
産業|さんぎょう|industry
工場|こうじょう|factory
空港|くうこう|airport
飛行機|ひこうき|airplane
地下鉄|ちかてつ|subway
交通|こうつう|traffic
事故|じこ|accident
運転|うんてん|driving
運動|うんどう|exercise
趣味|しゅみ|hobby
興味|きょうみ|interest
生活|せいかつ|daily life
習慣|しゅうかん|custom; habit
季節|きせつ|season
景色|けしき|scenery
台風|たいふう|typhoon
地震|じしん|earthquake
火事|かじ|fire (disaster)
警察|けいさつ|police
安全|あんぜん|safety
危険|きけん|danger
心配|しんぱい|worry
安心|あんしん|relief; peace of mind
大事|だいじ|important
特別|とくべつ|special
普通|ふつう|normal; usual
簡単|かんたん|easy; simple
複雑|ふくざつ|complicated
丁寧|ていねい|polite; careful
親切|しんせつ|kind
熱心|ねっしん|eager
自由|じゆう|freedom
必要|ひつよう|necessary
十分|じゅうぶん|enough
残念|ざんねん|regrettable; too bad
失礼|しつれい|rudeness; excuse me
最近|さいきん|recently
最初|さいしょ|first; beginning
最後|さいご|last; end
途中|とちゅう|on the way
以上|いじょう|or more; above
以下|いか|or less; below
以外|いがい|except; other than
今度|こんど|next time
将来|しょうらい|future
昔|むかし|long ago
世話|せわ|care; looking after
挨拶|あいさつ|greeting
返事|へんじ|reply
招待|しょうたい|invitation
お祝い|おいわい|celebration
お土産|おみやげ|souvenir
贈り物|おくりもの|gift
美術館|びじゅつかん|art museum
公園|こうえん|park
近所|きんじょ|neighborhood
建物|たてもの|building
屋上|おくじょう|rooftop
入口|いりぐち|entrance
出口|でぐち|exit
受付|うけつけ|reception desk
売り場|うりば|sales floor
品物|しなもの|goods
値段|ねだん|price
財布|さいふ|wallet
番組|ばんぐみ|TV program
放送|ほうそう|broadcast
小説|しょうせつ|novel
漫画|まんが|comics; manga
翻訳|ほんやく|translation
発音|はつおん|pronunciation
文法|ぶんぽう|grammar
会話|かいわ|conversation
意味|いみ|meaning
理由|りゆう|reason
注意|ちゅうい|caution; attention
規則|きそく|rule
関係|かんけい|relationship
彼女|かのじょ|she; girlfriend
彼|かれ|he; boyfriend
夫|おっと|husband
妻|つま|wife
息子|むすこ|son
娘|むすめ|daughter
祖父|そふ|grandfather
祖母|そぼ|grandmother
赤ちゃん|あかちゃん|baby
気分|きぶん|mood; feeling
気持ち|きもち|feeling
怪我|けが|injury
熱|ねつ|fever; heat
力|ちから|power; strength
声|こえ|voice
音|おと|sound
色|いろ|color
形|かたち|shape
光|ひかり|light
空気|くうき|air
星|ほし|star
月|つき|moon; month
集める|あつめる|to collect
決める|きめる|to decide
調べる|しらべる|to look up; investigate
届ける|とどける|to deliver
比べる|くらべる|to compare
続ける|つづける|to continue
考える|かんがえる|to think
伝える|つたえる|to tell; convey
運ぶ|はこぶ|to carry
選ぶ|えらぶ|to choose
喜ぶ|よろこぶ|to be glad
驚く|おどろく|to be surprised
急ぐ|いそぐ|to hurry
戻る|もどる|to return
届く|とどく|to reach; arrive
直す|なおす|to fix
壊れる|こわれる|to break
間に合う|まにあう|to be in time
手伝う|てつだう|to help
楽しむ|たのしむ|to enjoy
頑張る|がんばる|to do one's best
怒る|おこる|to get angry
笑う|わらう|to laugh
泣く|なく|to cry
写す|うつす|to copy; photograph
増える|ふえる|to increase
減る|へる|to decrease
建てる|たてる|to build
落ちる|おちる|to fall
拾う|ひろう|to pick up
捨てる|すてる|to throw away
探す|さがす|to look for
見つける|みつける|to find
思い出す|おもいだす|to recall
珍しい|めずらしい|rare
厳しい|きびしい|strict
嬉しい|うれしい|glad; happy
悲しい|かなしい|sad
寂しい|さびしい|lonely
恥ずかしい|はずかしい|embarrassed
正しい|ただしい|correct
美しい|うつくしい|beautiful
細かい|こまかい|fine; detailed
深い|ふかい|deep
浅い|あさい|shallow
固い|かたい|hard; firm
柔らかい|やわらかい|soft
眠い|ねむい|sleepy
苦い|にがい|bitter
汚い|きたない|dirty
`,

N3: `
宇宙|うちゅう|outer space
地球|ちきゅう|the Earth
環境|かんきょう|environment
自然|しぜん|nature
資源|しげん|resources
現在|げんざい|the present
過去|かこ|the past
未来|みらい|the future
年齢|ねんれい|age
性格|せいかく|personality
能力|のうりょく|ability
努力|どりょく|effort
目標|もくひょう|goal
目的|もくてき|purpose
結果|けっか|result
原因|げんいん|cause
影響|えいきょう|influence
効果|こうか|effect
状態|じょうたい|condition; state
条件|じょうけん|condition; terms
情報|じょうほう|information
記事|きじ|article
記者|きしゃ|reporter
事件|じけん|incident; case
犯人|はんにん|criminal
法律|ほうりつ|law
権利|けんり|right (entitlement)
義務|ぎむ|duty
責任|せきにん|responsibility
選挙|せんきょ|election
政府|せいふ|government
国際|こくさい|international
平和|へいわ|peace
戦争|せんそう|war
協力|きょうりょく|cooperation
競争|きょうそう|competition
成功|せいこう|success
失敗|しっぱい|failure
発見|はっけん|discovery
発明|はつめい|invention
発展|はってん|development
技術|ぎじゅつ|technology
機械|きかい|machine
道具|どうぐ|tool
材料|ざいりょう|material; ingredients
製品|せいひん|product
商品|しょうひん|merchandise
貿易|ぼうえき|trade
輸出|ゆしゅつ|export
輸入|ゆにゅう|import
給料|きゅうりょう|salary
税金|ぜいきん|tax
費用|ひよう|cost
予算|よさん|budget
貯金|ちょきん|savings
借金|しゃっきん|debt
収入|しゅうにゅう|income
支払い|しはらい|payment
契約|けいやく|contract
面接|めんせつ|interview
就職|しゅうしょく|getting a job
退職|たいしょく|retirement
専門|せんもん|specialty; major
講義|こうぎ|lecture
卒業|そつぎょう|graduation
入学|にゅうがく|entering a school
成績|せいせき|grades; results
合格|ごうかく|passing (an exam)
資格|しかく|qualification
知識|ちしき|knowledge
記憶|きおく|memory
想像|そうぞう|imagination
感情|かんじょう|emotion
感動|かんどう|being moved
緊張|きんちょう|nervousness
我慢|がまん|patience; endurance
遠慮|えんりょ|holding back
感謝|かんしゃ|gratitude
尊敬|そんけい|respect
信用|しんよう|trust; credit
秘密|ひみつ|secret
冗談|じょうだん|joke
文句|もんく|complaint
噂|うわさ|rumor
印象|いんしょう|impression
表情|ひょうじょう|facial expression
態度|たいど|attitude
健康|けんこう|health
手術|しゅじゅつ|surgery
栄養|えいよう|nutrition
睡眠|すいみん|sleep
呼吸|こきゅう|breathing
温度|おんど|temperature
気温|きおん|air temperature
洪水|こうずい|flood
被害|ひがい|damage; harm
避難|ひなん|evacuation
都市|とし|city
都会|とかい|big city
田舎|いなか|countryside
郊外|こうがい|suburbs
住所|じゅうしょ|address
交差点|こうさてん|intersection
信号|しんごう|traffic light
渋滞|じゅうたい|traffic jam
乗客|じょうきゃく|passenger
往復|おうふく|round trip
片道|かたみち|one way
到着|とうちゃく|arrival
出発|しゅっぱつ|departure
観光|かんこう|sightseeing
宿泊|しゅくはく|lodging
温泉|おんせん|hot spring
祭り|まつり|festival
伝統|でんとう|tradition
芸術|げいじゅつ|art
作品|さくひん|work (of art)
演奏|えんそう|musical performance
舞台|ぶたい|stage
登場|とうじょう|appearance; entrance
主人公|しゅじんこう|main character
物語|ものがたり|story; tale
表現|ひょうげん|expression
単語|たんご|word; vocabulary
発表|はっぴょう|announcement; presentation
報告|ほうこく|report
確認|かくにん|confirmation
許可|きょか|permission
禁止|きんし|prohibition
注文|ちゅうもん|order
配達|はいたつ|delivery
修理|しゅうり|repair
洗濯|せんたく|laundry
片付ける|かたづける|to tidy up
預ける|あずける|to leave in someone's care
与える|あたえる|to give
表す|あらわす|to express
現れる|あらわれる|to appear
疑う|うたがう|to doubt
争う|あらそう|to compete; dispute
祈る|いのる|to pray
許す|ゆるす|to forgive; permit
認める|みとめる|to admit; recognize
任せる|まかせる|to entrust
迷う|まよう|to get lost; hesitate
悩む|なやむ|to worry
諦める|あきらめる|to give up
慣れる|なれる|to get used to
離れる|はなれる|to move away from
含む|ふくむ|to include
加える|くわえる|to add
支える|ささえる|to support
助ける|たすける|to help; rescue
守る|まもる|to protect
破る|やぶる|to tear; break (a promise)
燃える|もえる|to burn
温める|あたためる|to warm up
混ぜる|まぜる|to mix
詳しい|くわしい|detailed
激しい|はげしい|intense
鋭い|するどい|sharp
大人しい|おとなしい|quiet; well-behaved
懐かしい|なつかしい|nostalgic
羨ましい|うらやましい|envious
貧しい|まずしい|poor
怪しい|あやしい|suspicious
親しい|したしい|close; friendly
正確|せいかく|accurate
確か|たしか|certain; sure
立派|りっぱ|splendid
完全|かんぜん|complete; perfect
重要|じゅうよう|important
基本|きほん|basics
具体的|ぐたいてき|concrete; specific
積極的|せっきょくてき|proactive
急に|きゅうに|suddenly
偶然|ぐうぜん|by chance
次第に|しだいに|gradually
相変わらず|あいかわらず|as usual
`,

N2: `
維持|いじ|maintenance
解決|かいけつ|solution
改善|かいぜん|improvement
解釈|かいしゃく|interpretation
観察|かんさつ|observation
管理|かんり|management
企画|きかく|planning; project
規模|きぼ|scale; scope
共通|きょうつう|common; shared
供給|きょうきゅう|supply
需要|じゅよう|demand
金融|きんゆう|finance
景気|けいき|business conditions
傾向|けいこう|tendency
継続|けいぞく|continuation
検討|けんとう|consideration
現象|げんしょう|phenomenon
貢献|こうけん|contribution
構成|こうせい|composition
混乱|こんらん|confusion
削除|さくじょ|deletion
作業|さぎょう|work; operation
支援|しえん|support
姿勢|しせい|posture; stance
実験|じっけん|experiment
実施|じっし|implementation
指摘|してき|pointing out
主張|しゅちょう|claim; assertion
手段|しゅだん|means
出版|しゅっぱん|publication
省略|しょうりゃく|omission
証明|しょうめい|proof
処理|しょり|processing
信頼|しんらい|trust
推薦|すいせん|recommendation
制限|せいげん|restriction
製造|せいぞう|manufacturing
設備|せつび|equipment
選択|せんたく|selection
増加|ぞうか|increase
減少|げんしょう|decrease
組織|そしき|organization
対象|たいしょう|target; subject
対策|たいさく|countermeasure
担当|たんとう|being in charge
地域|ちいき|region
調整|ちょうせい|adjustment
調査|ちょうさ|survey; investigation
提案|ていあん|proposal
適切|てきせつ|appropriate
展開|てんかい|development; unfolding
統一|とういつ|unification
特徴|とくちょう|characteristic
独立|どくりつ|independence
内容|ないよう|content
認識|にんしき|recognition
把握|はあく|grasp
判断|はんだん|judgment
比較|ひかく|comparison
評価|ひょうか|evaluation
普及|ふきゅう|spread; diffusion
分析|ぶんせき|analysis
分野|ぶんや|field; area
平均|へいきん|average
変化|へんか|change
方針|ほうしん|policy
保存|ほぞん|preservation; saving
発揮|はっき|display (of ability)
範囲|はんい|range; scope
反省|はんせい|reflection
否定|ひてい|denial
負担|ふたん|burden
保証|ほしょう|guarantee
募集|ぼしゅう|recruitment
矛盾|むじゅん|contradiction
目安|めやす|rough guide
役割|やくわり|role
輸送|ゆそう|transport
要求|ようきゅう|demand; request
要素|ようそ|element
予測|よそく|prediction
利益|りえき|profit
領域|りょういき|domain; territory
論理|ろんり|logic
話題|わだい|topic
曖昧|あいまい|vague
著しい|いちじるしい|remarkable
穏やか|おだやか|calm
主に|おもに|mainly
快適|かいてき|comfortable
頑丈|がんじょう|sturdy
貴重|きちょう|precious
器用|きよう|dexterous
強力|きょうりょく|powerful
険しい|けわしい|steep
豪華|ごうか|luxurious
慎重|しんちょう|careful; cautious
素直|すなお|honest; obedient
鮮やか|あざやか|vivid
退屈|たいくつ|boring
妥当|だとう|valid; reasonable
乏しい|とぼしい|scarce
鈍い|にぶい|dull; slow
柔軟|じゅうなん|flexible
扱う|あつかう|to handle
誤る|あやまる|to make a mistake
抱える|かかえる|to hold; to have (problems)
限る|かぎる|to limit
構う|かまう|to mind; care about
傾く|かたむく|to lean; tilt
稼ぐ|かせぐ|to earn
競う|きそう|to compete
異なる|ことなる|to differ
従う|したがう|to obey; follow
備える|そなえる|to prepare for
蓄える|たくわえる|to store up
頼る|たよる|to rely on
縮む|ちぢむ|to shrink
努める|つとめる|to strive
整える|ととのえる|to arrange
眺める|ながめる|to gaze at
除く|のぞく|to exclude
省く|はぶく|to omit
防ぐ|ふせぐ|to prevent
招く|まねく|to invite
求める|もとめる|to seek; request
養う|やしなう|to nurture; support
譲る|ゆずる|to hand over; yield
略す|りゃくす|to abbreviate
`,

N1: `
斡旋|あっせん|mediation
遺憾|いかん|regrettable
意図|いと|intention
隠蔽|いんぺい|concealment
迂回|うかい|detour
円滑|えんかつ|smooth
婉曲|えんきょく|euphemistic
概略|がいりゃく|outline
改革|かいかく|reform
該当|がいとう|applicable
画期的|かっきてき|groundbreaking
過剰|かじょう|excess
過疎|かそ|depopulation
葛藤|かっとう|inner conflict
還元|かんげん|giving back; reduction
勧告|かんこく|official advice
慣行|かんこう|customary practice
緩和|かんわ|easing; relief
危惧|きぐ|apprehension
軌道|きどう|orbit; track
規範|きはん|norm; standard
起伏|きふく|ups and downs
脚光|きゃっこう|spotlight
窮屈|きゅうくつ|cramped
脅威|きょうい|threat
享受|きょうじゅ|enjoyment
均衡|きんこう|balance
屈指|くっし|one of the best
経緯|けいい|circumstances; details
継承|けいしょう|succession
啓発|けいはつ|enlightenment
懸念|けねん|concern
見解|けんかい|view; opinion
顕著|けんちょ|remarkable
権威|けんい|authority
交渉|こうしょう|negotiation
控除|こうじょ|deduction
拘束|こうそく|restraint
抗議|こうぎ|protest
互角|ごかく|evenly matched
誇張|こちょう|exaggeration
根拠|こんきょ|basis; grounds
採択|さいたく|adoption
錯覚|さっかく|illusion
示唆|しさ|suggestion; hint
施策|しさく|measure; policy
慈善|じぜん|charity
執着|しゅうちゃく|attachment; obsession
充実|じゅうじつ|fullness; richness
趣旨|しゅし|purpose; gist
循環|じゅんかん|circulation
衝撃|しょうげき|shock; impact
象徴|しょうちょう|symbol
衝突|しょうとつ|collision
奨励|しょうれい|encouragement
進捗|しんちょく|progress
迅速|じんそく|swift
是正|ぜせい|correction
措置|そち|measure; step
遂行|すいこう|execution
衰退|すいたい|decline
折衷|せっちゅう|compromise; blend
潜在|せんざい|latent
相殺|そうさい|offset; cancel out
阻止|そし|prevention; blocking
妥協|だきょう|compromise
打診|だしん|sounding out
脱却|だっきゃく|breaking free
緻密|ちみつ|precise; meticulous
仲裁|ちゅうさい|arbitration
懲戒|ちょうかい|disciplinary action
陳腐|ちんぷ|hackneyed
追及|ついきゅう|pursuit; questioning
提携|ていけい|partnership
撤回|てっかい|retraction
撤退|てったい|withdrawal
転換|てんかん|conversion; shift
倒産|とうさん|bankruptcy
匿名|とくめい|anonymity
捏造|ねつぞう|fabrication
排除|はいじょ|exclusion
破綻|はたん|collapse; failure
繁栄|はんえい|prosperity
煩雑|はんざつ|complicated; troublesome
頻繁|ひんぱん|frequent
敏感|びんかん|sensitive
不可欠|ふかけつ|indispensable
普遍|ふへん|universal
紛争|ふんそう|dispute; conflict
弊害|へいがい|harmful effect
変遷|へんせん|transition
放棄|ほうき|abandonment
膨大|ぼうだい|enormous
抜粋|ばっすい|excerpt
摩擦|まさつ|friction
漠然|ばくぜん|vague
未曾有|みぞう|unprecedented
無謀|むぼう|reckless
名誉|めいよ|honor
模索|もさく|groping; searching
猶予|ゆうよ|grace period
融通|ゆうずう|flexibility
擁護|ようご|protection; defense
抑制|よくせい|restraint; control
濫用|らんよう|abuse; misuse
履歴|りれき|history; record
了承|りょうしょう|acknowledgment
連携|れんけい|coordination
露骨|ろこつ|blatant
賄賂|わいろ|bribe
和解|わかい|reconciliation
潔い|いさぎよい|graceful; manly
疎か|おろそか|negligent
厳か|おごそか|solemn
朗らか|ほがらか|cheerful
健やか|すこやか|healthy
滑らか|なめらか|smooth
緩やか|ゆるやか|gentle; gradual
赴く|おもむく|to proceed to
培う|つちかう|to cultivate
携わる|たずさわる|to be involved in
営む|いとなむ|to run (a business)
覆す|くつがえす|to overturn
費やす|ついやす|to spend
阻む|はばむ|to obstruct
施す|ほどこす|to give; carry out
賄う|まかなう|to cover (costs)
司る|つかさどる|to govern
促す|うながす|to urge
秘める|ひめる|to hide; keep secret
誇る|ほこる|to take pride in
拒む|こばむ|to refuse
貫く|つらぬく|to pierce; carry through
潤う|うるおう|to be moist; profit
目論む|もくろむ|to scheme
戒める|いましめる|to admonish
遮る|さえぎる|to interrupt; block
唱える|となえる|to recite; advocate
慕う|したう|to adore; yearn for
滞る|とどこおる|to be delayed
綻びる|ほころびる|to come apart; begin to bloom
`,
};

/* Four-character idioms: the giant meteor carries one at N3 and above.
   A leading * marks the common ones used from N3. */
const YOJI_RAW = `
*一生懸命|いっしょうけんめい|with all one's might
*一石二鳥|いっせきにちょう|two birds with one stone
*十人十色|じゅうにんといろ|to each their own
*一期一会|いちごいちえ|a once-in-a-lifetime meeting
*自業自得|じごうじとく|you reap what you sow
*半信半疑|はんしんはんぎ|half in doubt
*試行錯誤|しこうさくご|trial and error
*油断大敵|ゆだんたいてき|carelessness is the worst enemy
*心機一転|しんきいってん|a fresh start
*危機一髪|ききいっぱつ|a hair's breadth from danger
七転八起|しちてんはっき|fall seven times, rise eight
異口同音|いくどうおん|with one voice
臨機応変|りんきおうへん|adapting to circumstances
以心伝心|いしんでんしん|unspoken understanding
弱肉強食|じゃくにくきょうしょく|survival of the fittest
有言実行|ゆうげんじっこう|doing what you say
温故知新|おんこちしん|learning from the past
大器晩成|たいきばんせい|great talents bloom late
一部始終|いちぶしじゅう|the whole story
前代未聞|ぜんだいみもん|unheard of
単刀直入|たんとうちょくにゅう|straight to the point
千差万別|せんさばんべつ|infinite variety
電光石火|でんこうせっか|lightning fast
天変地異|てんぺんちい|natural cataclysm
日進月歩|にっしんげっぽ|rapid progress
五里霧中|ごりむちゅう|completely lost
一触即発|いっしょくそくはつ|explosive situation
東奔西走|とうほんせいそう|running around busily
起死回生|きしかいせい|a dramatic comeback
用意周到|よういしゅうとう|thoroughly prepared
`;

function parseVocab() {
  const out = {};
  for (const lv of Object.keys(VOCAB_RAW)) {
    out[lv] = VOCAB_RAW[lv].split('\n').map((s) => s.trim()).filter(Boolean).map((line) => {
      const [w, r, m] = line.split('|');
      return { id: lv + ':' + w, lv, w, r: r || w, m };
    });
  }
  out.yoji = YOJI_RAW.split('\n').map((s) => s.trim()).filter(Boolean).map((line) => {
    const common = line[0] === '*';
    const [w, r, m] = (common ? line.slice(1) : line).split('|');
    return { id: 'yoji:' + w, lv: 'yoji', w, r, m, common };
  });
  return out;
}
const VOCAB = parseVocab();

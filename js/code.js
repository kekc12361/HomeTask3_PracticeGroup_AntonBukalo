/*
	Jack  11
	Queen  12
	King  13
	Ace 1
*/

const GAME_SETTINGS = {
    numbers: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13],
    signs: ['', 'A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'],
    amounts: {
        total: 52,
        dealDeck: 24,
        decks: [1, 2, 3, 4, 5, 6, 7], // amount of cards in every playing deck
        deal: 1
    },
    suits: [0, 1, 2, 3], //hearts, diamonds, clovers, spades
    suitsNames: ['hearts', 'diamonds', 'clovers', 'spades'],
    colors: [0, 1], //red, black
    timeout: 10000
}

window.addEventListener('load', function() {
    new Game();
});

function Game() {
    this.dealDeck = null;
    this.finishDecks = [];
    this.playDecks = [];
    this.deckKit = this.generateDeckKit();

    this.$stashContainer = document.getElementById('stashDecks');
    this.$playContainer = document.getElementById('playDecks');
    this.$el = document.getElementById('game');

    this.createDecks();
    this.registerEvents();
}

function DealDeck() {
    Deck.apply(this,arguments);

    //deal deck must create extra deck node nearby to place opened cards there
    this.$el.classList.add('flat');
    this.$wrapper.classList.add('col-3');
}

function FinishDeck() {
    Deck.apply(this,arguments);
    this.$el.classList.add('flat');
    this.cards = [];
    this.suit = null;
}

function PlayingDeck(cardsKit) {
    Deck.apply(this,arguments);
    this.$el.dataset.type = "playDeck";
    this.openLastCard();
}

function Deck(cardsKit) { // cards kit is array of objects like this [{number: 1, suit: 0, color: 0}, {number: 6, suit: 1, color: 1}]
    this.cards = [];

    this.$el = document.createElement('div');
    this.$wrapper = document.createElement('div');

    if (cardsKit.length) {
        this.createCards(cardsKit);
    }

    //decks must be wrapped in .col div
    this.$wrapper.appendChild(this.$el);
    this.$wrapper.classList.add('col');
    this.$el.classList.add('deck');
    this.$el.draggable = true;
    this.registerEvents();
}

function Card(cardKit) {
    this.color = cardKit.color;
    this.suit = cardKit.suit;
    this.number = cardKit.number;
    this.isOpen = false;

    this.$el = document.createElement('div');
    this.$el.classList.add('card', GAME_SETTINGS.suitsNames[cardKit.suit]);
    this.$el.innerText = GAME_SETTINGS.signs[cardKit.number];
    this.$el.draggable = true;

    this.registerEvents();
}

Game.prototype = {
    createDecks: function() {
        this.$stashContainer.innerHTML = '';
        this.$playContainer.innerHTML = '';
        this.timeoutID = null;

        let decks = this.getShuffledDecks();

        this.dealDeck = new DealDeck(decks.splice(0,GAME_SETTINGS.amounts.dealDeck));
        this.$stashContainer.appendChild(this.dealDeck.$wrapper);

        for (let i = 0;i < GAME_SETTINGS.suits.length;i++){
            this.finishDecks[i] = new FinishDeck([]);
            this.$stashContainer.appendChild(this.finishDecks[i].$wrapper);
        }

        for (let i = 0;i < GAME_SETTINGS.amounts.decks.length;i++) {
            this.playDecks[i] = new PlayingDeck(decks.splice(0, GAME_SETTINGS.amounts.decks[i]));
            this.playDecks[i].draggable = true;
            this.$playContainer.appendChild(this.playDecks[i].$wrapper);
        }
        //create decks here
    },

    getShuffledDecks: function () {
        let kit = this.deckKit.slice();

        for (let i = kit.length-1;i>=0;i--){
            let index = Math.round(Math.random() * (kit.length - 1));
            let tmp = kit[i];
            kit[i] = kit[index];
            kit[index] = tmp;
        }

        return kit;
    },

    generateDeckKit: function () {
        let deck = [];
            for (let j = 0; j < 4; j++){
                for (let k = 1; k < 14; k++){
                    deck.push({color:Math.round(j/4),suit:j,number:k});
                }
            }

        return deck;

    },
    registerEvents: function() {
            this.$el.addEventListener("deckClicked", this.onDeckClick().bind(this));
            this.$el.addEventListener("deckDblclick", this.onDeckDoubleClick.bind(this));

    },

    onDeckDoubleClick: function (e) {
       window.clearTimeout(this.timeoutID);
        if (e.detail.deck instanceof PlayingDeck && e.detail.card[0]
            !=e.detail.deck.cards[e.detail.deck.cards.length-1]) {
                return 1;
        }
        //для того чтобы если не последний эл-т playingDeck, то выходит
        let card = e.detail.card;
        let finDeck = this.finishDecks;
        this.unselectDeck(e.detail.deck);

            let pos = this.checkFinishPosCard(card, finDeck);
            if (pos >= 0) {
                this.moveCards(e.detail.deck, this.finishDecks[pos], card);
                if (JSON.stringify(e.detail.deck) !== JSON.stringify(this.dealDeck)) {//колода ли это
                    e.detail.deck.openLastCard();
                }
        }
        if (this.checkVictory()){
            alert("victory!!!");
        } //victory
        this.timeoutID = window.setTimeout(this.showNextMove.bind(this), GAME_SETTINGS.timeout);
    },

    checkFinishPosCard: function (card, deck ) {
        for (let i = 0;i < 4; i++) {
            let tmpDeck = deck[i].cards;
            if ((tmpDeck.length == 0 && card[0].number == 1 )||(this.isComparableToPosDoubleClick(tmpDeck,card))) {
                return i
            }
        }
        return -1;
    },

    isComparableToPosDoubleClick(deck,card){
        return deck.length > 0 && deck[deck.length - 1].hasSameColor(card[0]) &&
            card[0].number - deck[deck.length-1].number === 1 && card[0].hasSameSuit(deck[deck.length - 1]);
    },

    onDeckClick: function() {
        // let timeoutID = null;
        let firstDeck = null;
        let movingCards = [];
        return function(e) {
            window.clearTimeout(this.timeoutID);
            this.unhighlightForAll();
            let secondDeck = e.detail.deck;
            let cards = e.detail.cards;
            this.moveKing(firstDeck, secondDeck, cards, movingCards);

            cards = this.sliceForDealDeck(firstDeck, secondDeck, cards);
            if (cards != undefined) {
                cards.forEach(card => card.select());
            }
            if (e.detail.dragFirst) {
                this.unselectDeck(secondDeck);
                firstDeck = secondDeck;
                movingCards = cards;
            }else if (firstDeck && firstDeck != secondDeck  &&(cards)){
                    if (this.checkMove(movingCards, secondDeck)) {
                        this.moveCards(firstDeck, secondDeck, movingCards);
                    }
                    this.openLastCardForPlayingDeck(firstDeck);
                    this.unselectDeck(firstDeck);
                    this.unselectDeck(secondDeck);
                    firstDeck = null;
                    movingCards = [];

            } else if (firstDeck == secondDeck &&(cards)){// if 2 clicks on one deck
                    this.unselectDeck(firstDeck);
                    this.unselectDeck(secondDeck);
                    firstDeck = null;
                    movingCards = [];

            } else if (cards) {
                firstDeck = secondDeck;
                movingCards = cards;
            }
            this.timeoutID = window.setTimeout(this.showNextMove.bind(this), GAME_SETTINGS.timeout);
        }
    },

    showNextMove: function(){
        for (let i = 0;i < this.playDecks.length; i++){
            let temp = this.checkOpenCard(this.playDecks[i]);
            for (let j = 0;j < this.playDecks.length;j++){
                if (this.checkMove(temp,this.playDecks[j])){
                    temp.forEach(cards => cards.highlightForMoveWait());
                    this.playDecks[j].cards[this.playDecks[j].cards.length -1].highlightForMoveWait();
                    return 1;
                }
            }
        }
    },

    unhighlightForAll: function(){
      for (let i = 0; i < this.playDecks.length;i++){
          this.playDecks[i].cards.forEach(cards => cards.unhighlightForMoveWait());
      }
    },

    checkOpenCard: function(deck){
       for (let i = 0;i < deck.cards.length; i++){
           if (deck.cards[i].isOpen){
               return deck.cards.slice(i);
           }
       }
    },

    sliceForDealDeck: function (firstDeck,secondDeck,cards) {
        if (secondDeck instanceof DealDeck && firstDeck === null &&(cards !==undefined))//if dealdeck--> took 1
            return cards.slice(0,1);
        return cards;
    },

    checkVictory: function () {
      for (let i = 0;i < 4 ;i++){
          if (this.isVictorySolution(this.finishDecks[i])) return false
      }
  		return true;
    },

    isVictorySolution(finishDeck){
        return finishDeck.cards.length==0 || finishDeck.cards[finishDeck.cards.length-1].number != 13
    },

    moveKing: function (firstDeck,secondDeck,cards,movingCards){//to move king on deck with no cards
        if (firstDeck!=null && cards == undefined){
            if (movingCards[0].number == 13){
                this.moveCards(firstDeck, secondDeck, movingCards);
                this.openLastCardForPlayingDeck(firstDeck);
                firstDeck = null;
                secondDeck.cards.forEach((card) => card.unselect());
            }
        }
    },

    openLastCardForPlayingDeck: function(deck){
        if (deck instanceof PlayingDeck)//колода ли это
            deck.openLastCard();
    },

    checkMove: function (cards, secondDeck) {
        let from = cards[0];
        let to = secondDeck.cards[secondDeck.cards.length-1];

        if (!from.hasSameColor(to) && (to.number - from.number == 1)) return true;
        else return false;
    },

    unselectDeck: function (firstDeck) {//unselect decks after move them
        firstDeck.cards.forEach((card) => card.unselect());
    },

    moveCards: function (from, to, cards) {//moving cards
            to.addCards(cards);
            from.removeCards(cards);
    },

}

Deck.prototype = {
    createCards: function (cardKits) {
        for (let i = 0; i < cardKits.length; i++) {
            let card = new Card(cardKits[i]);

            this.$el.appendChild(card.$el);
            this.cards.push(card);
        }
    },

    onClick: function(e){
        if (e.target.dataset.type == "playDeck" && e.target.firstChild == null) {//check deck with no cards
            let event = new CustomEvent('deckClicked', {
                bubbles: true,
                detail: {
                    deck: this,
                    cards: undefined
                }
            });
            this.$el.dispatchEvent(event);
        }
    },

    onDragEnter: function(event){
        if (event.preventDefault) {
            event.preventDefault(); // Necessary. Allows us to drop.
        }
    },

    onDeckDragEnd: function(e){
        if (e.target.dataset.type == "playDeck" && e.target.firstChild == null){
            let event = new CustomEvent('deckClicked', {
                bubbles: true,
                detail: {
                    deck: this,
                    cards: undefined
                }
            });
            this.$el.dispatchEvent(event);
        }
    },

    registerEvents: function () {
        this.$el.addEventListener("cardClicked", this.onCardClick.bind(this));
        this.$el.addEventListener("cardDblclick", this.onCardDoubleClick.bind(this));
        this.$el.addEventListener("click", this.onClick.bind(this));
        this.$el.addEventListener("drop", this.onDeckDragEnd.bind(this));
        this.$el.addEventListener("dragover", this.onDragEnter.bind(this));
    },

    onCardDoubleClick: function (e) {
        let cards = [e.detail.card];
        let event = new CustomEvent('deckDblclick', {
            bubbles: true,
            detail: {
                deck: this,
                card: cards,
            }
        });
        this.$el.dispatchEvent(event);
    },

    onCardClick: function (e) {
        let dragFirst = undefined;
        if (e.detail.dragFirst){
            dragFirst = e.detail.dragFirst
        }
        let cards = this.cards.slice(this.cards.indexOf(e.detail.card));
        let event = new CustomEvent('deckClicked', {
            bubbles: true,
            detail: {
                deck: this,
                cards: cards,
                dragFirst:dragFirst
            }
        });
        this.$el.dispatchEvent(event);
    },

    addCards: function (cards) {
        for (let i = 0; i < cards.length; i++) {
            this.$el.appendChild(cards[i].$el);
            this.cards.push(cards[i]);
        }
    },

    removeCards: function (cards) {
        let index = this.cards.indexOf(cards[0]);
        let lastIndex = cards.length;
        this.cards.splice(index,lastIndex);
    },


}
Card.prototype = {
    select: function() {
        this.$el.classList.add('selected');
    },

    unselect: function() {
        this.$el.classList.remove('selected');
    },

    highlightForMoveWait: function(){
        this.$el.classList.add('highlight');
    },

    unhighlightForMoveWait: function(){
        this.$el.classList.remove('highlight');
    },

    open: function() {
        this.$el.classList.add('open');
        this.isOpen = true;
    },

    close: function () {
        this.$el.classList.remove('open');
        this.isOpen = false;
    },

    hasSameColor: function(card) {
        return  this.color === card.color;
    },

    hasSameSuit: function(card) {
        return this.suit === card.suit;
    },

    onClick: function() {
        let event  = new CustomEvent('cardClicked', {
            bubbles: true,
            detail:{
                card:this
            }
        });
        this.$el.dispatchEvent(event);

    },

    onDoubleClick: function() {
        let event  = new CustomEvent('cardDblclick', {
            bubbles: true,
            detail:{
                card:this
            }
        });
        this.$el.dispatchEvent(event);
    },

    isClosed: function () {
       return !this.isOpen;
    },

    registerEvents: function() {
        this.$el.addEventListener('click', this.onClick.bind(this));
        this.$el.addEventListener('dblclick', this.onDoubleClick.bind(this));

        this.$el.addEventListener("dragstart", this.onDragStart.bind(this));
        this.$el.addEventListener("drop",this.onDragEnd.bind(this));
        this.$el.addEventListener("dragover", this.onDragEnter.bind(this));
    },

    onDragStart: function(event){
        event.dataTransfer.effectAllowed = "move";
         let e  = new CustomEvent('cardClicked', {
            bubbles: true,
            detail:{
                card:this,
                dragFirst:true
            }
        });
        this.$el.dispatchEvent(e);
    },

    onDragEnter: function(event){
        if (event.preventDefault) {
            event.preventDefault(); // Necessary. Allows us to drop.
        }
        event.dataTransfer.dropEffect = "move";
    },

    onDragEnd: function(){
        let e  = new CustomEvent('cardClicked', {
            bubbles: true,
            detail:{
                card:this

            }
        });
        this.$el.dispatchEvent(e);

    },


}

DealDeck.prototype = Object.assign(Object.create(Deck.prototype), {
    onClick: function(e) {
        if (!e.target.className.includes("open")) {
            if (this.getFirstClosedCard()) {
                this.getFirstClosedCard().open();
            } else
                this.turnOverDeck()
        }
    },

    getFirstClosedCard: function() {
        return this.cards.find(card => card.isClosed());
    },

    turnOverDeck: function () {
       this.cards.forEach(card => card.close())
    },

    registerEvents: function () {
        Deck.prototype.registerEvents.call(this);
    }
});

FinishDeck.prototype = Object.assign(Object.create(Deck.prototype), {
    registerEvents: function(){}
});

PlayingDeck.prototype = Object.assign(Object.create(Deck.prototype), {
    openLastCard: function () { //open first card for generating and other
        if (this.cards.length)
            this.cards[this.cards.length-1].open();
    },
});





























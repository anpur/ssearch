class SSearch {
    constructor(options = {}) {
        this.options = {
            debug: options.debug !== undefined ? options.debug : false,
            doubleTolerance: options.doubleTolerance !== undefined ? options.doubleTolerance : false
        };
    }

    search(text, query) {
        var match = this._exactMatch(text, query);
        if (!match) {
            text = text.toLowerCase();
            query = query.toLowerCase();
            match = this._exactMatch(text, query);
        }

        if (match) { 
            return match;
        }

        const words = this._splitByWords(query);

        return words.length > 1
            ? this._searchBySeveralWords(text, words)
            : this._searchByWord(text, words[0]);
    }

    _getOneLetterWeight(word) {
        return 1 / word.length;
    }

    _searchByWord(text, word) {
        const wordSearhes = (text, word, matcher) => {
            var match;

            // exact match in case this is nested search
            match = this._exactMatch(text, word);
            if (match) {
                return match;
            }

            // letters mixed
            match = this._twoLettersMixed(text, word, matcher);
            if (match) {
                return match;
            }
    
            // one extra letter
            match = this._extraLetter(text, word, matcher);
            if (match) {
                return match;
            }
    
            // one letter missing
            match = this._oneLetterMissing(text, word, matcher);
            if (match) {
                return match;
            }
    
            return null;
        }

        let match = wordSearhes(text, word, (text, word) => this._exactMatch(text, word));
        if (match) {
            return match;
        }

        if (!this.options.doubleTolerance) {
            return match;
        }

        match = wordSearhes(text, word, (text, word) => wordSearhes(text, word, (text, word) => this._exactMatch(text, word)));
        return match;
    }

    _extraLetter(text, word, searcher) {
        const growRight = (textIndex, wordIndex) => {
            let offset;
            for (offset = 0; wordIndex + offset < word.length; offset++) {
                if (text[textIndex + offset] !== word[wordIndex + offset]) {
                    return offset;
                }
            }
            return offset;
        };
        const growLeft = (textIndex, wordIndex) => {
            let offset;
            for (offset = 0; wordIndex - offset > 0; offset++) {
                if (text[textIndex - offset] !== word[wordIndex - offset]) {
                    return offset;
                }
            }
            return offset;
        };

        const expectedScore = 1 - this._getOneLetterWeight(word) / 2;

        let wordIndex = word.length / 2;
        const leftPart = word.substring(0, wordIndex);
        const leftMatch = searcher(text, leftPart);
        const rightPart = word.substring(leftPart.length);
        const rightMatch = searcher(text, rightPart);
        
        if (leftMatch && (!rightMatch || leftMatch.score >= rightMatch.score)) { // Left part
            const index = leftMatch.indexes[0];
            const textIndex = index.start + index.length;
            const wordIndex = word.length / 2;

            const offset = growRight(textIndex, wordIndex);  // grow till wrong letter
            const offsetAfter = growRight(
                textIndex + offset + 1, wordIndex + offset); // grow after wrong letter
            if (offsetAfter !== 0 || text[textIndex + offset + 1] === word[wordIndex + offset]) {
                index.length += offset + 1 + offsetAfter;
                leftMatch.score = expectedScore;
                if (this.options.debug) {
                    leftMatch.debug.push(`extra letter '${word}' -> '${this._getMatch(text, leftMatch)}'`);
                }
                return leftMatch;
            }
        } else if (rightMatch) {                                // Right part
            const index = rightMatch.indexes[0];
            const textIndex = index.start;
            const wordIndex = leftPart.length;

            const offset = growLeft(textIndex, wordIndex);      // grow till wrong letter
            const offsetAfter = growLeft(
                textIndex - offset - 1, wordIndex - offset); // grow after wrong letter
            if (offsetAfter !== 0 || text[textIndex - offset - 1] === word[wordIndex - offset]) {
                index.length += offset + 1 + offsetAfter;
                index.start -= offset + 1 + offsetAfter;
                rightMatch.score = expectedScore;
                if (this.options.debug) {
                    rightMatch.debug.push(`extra letter '${word}' -> '${this._getMatch(text, rightMatch)}'`);
                }
                return rightMatch;
            }
        }

        return null;
    }

    _twoLettersMixed(text, word, searcher) {
        let match;

        for (let i = 0; i + 1 < word.length; i += 1) {
            const newWord = word.substring(0, i) + word[i + 1] + word[i] + word.substring(i + 2);
            match = searcher(text, newWord);
            if (match) {
                match.score = 1 - (match.score * this._getOneLetterWeight(word) / 2);
                if (this.options.debug) {
                    match.debug.push(`two letters mixed '${word}' -> '${this._getMatch(text, match)}'`);
                }
                return match;
            }
        }
    }

    _getMatch(text, match) {
        return text.substring(match.indexes.start, match.indexes.start + match.indexes.length);
    }

    _oneLetterMissing(text, word, searcher) {
        let match;
        for (let i = 0; i < word.length; i++) {
            const newWord = word.substring(0, i) + word.substring(i + 1);
            match = searcher(text, newWord);
            if (match) {
                match.score =  match.score * (1 - this._getOneLetterWeight(word));
                if (this.options.debug) {
                    match.debug.push(`letter missing '${word}' -> '${this._getMatch(text, match)}'`);
                }
                return match;
            }
        }
        return null;
    }

    _searchBySeveralWords(text, words) {
        return null;
    }

    _splitByWords(query) {
        return query.match(/([^\u0000-\u007F]|[\w\n-_'])+/gi);
    }

    _exactMatch(text, query) {
        const index = text.indexOf(query);
        if (index !== -1) {
            const result = { 
                score: 1,
                indexes: [
                    { start: index, length: query.length }
                ]
            };

            if (this.options.debug) {
                result.debug = [ `exact '${query}'` ];
            }

            return result;
        }
    }
}

module.exports = { 
    SSearch: SSearch
};
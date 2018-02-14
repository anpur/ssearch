class SSearch {
    constructor(options = {}) {
        this.options = {
            something: options.something !== undefined ? options.something : false
        };
    }

    search(text, query) {
        var match = this._checkExactMatch(text, query);
        if (!match) {
            text = text.toLowerCase();
            query = query.toLowerCase();
            match = this._checkExactMatch(text, query);
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
        var match;

        // letters mixed
        match = this._twoLettersMixed(text, word, this._checkExactMatch);
        if (match) {
            return match;
        }

        // one extra letter
        match = this._extraLetter(text, word, this._checkExactMatch);
        if (match) {
            return match;
        }

        // one letter missing
        match = this._oneLetterMissing(text, word, this._checkExactMatch);
        if (match) {
            return match;
        }

        return null;
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

        // Left part
        let wordIndex = word.length / 2;
        const leftPart = word.substring(0, wordIndex);
        let match = searcher(text, leftPart);
        if (match) {
            const index = match.indexes[0];
            const textIndex = index.start + index.length;
            const wordIndex = word.length / 2;

            const offset = growRight(textIndex, wordIndex);      // grow till wrong letter
            const offsetAfter = growRight(
                textIndex + offset + 1, wordIndex + offset); // grow after wrong letter
            if (offsetAfter !== 0 || text[textIndex + offset + 1] === word[wordIndex + offset]) {
                index.length += offset + 1 + offsetAfter;
                match.score = expectedScore;
                return match;
            }
        }

        // Right part 
        const rightPart = word.substring(leftPart.length);
        match = searcher(text, rightPart);
        if (match) {
            const index = match.indexes[0];
            const textIndex = index.start;
            const wordIndex = leftPart.length;

            const offset = growLeft(textIndex, wordIndex);      // grow till wrong letter
            const offsetAfter = growLeft(
                textIndex - offset - 1, wordIndex - offset); // grow after wrong letter
            if (offsetAfter !== 0 || text[textIndex - offset - 1] === word[wordIndex - offset]) {
                index.length += offset + 1 + offsetAfter;
                index.start -= offset + 1 + offsetAfter;
                match.score = expectedScore;
                return match;
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
                return match;
            }
        }
    }

    _oneLetterMissing(text, word, searcher) {
        let match;
        for (let i = 0; i < word.length; i++) {
            const newWord = word.substring(0, i) + word.substring(i + 1);
            match = searcher(text, newWord);
            if (match) {
                match.score = 1 - (match.score * this._getOneLetterWeight(word));
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

    _checkExactMatch(text, query) {
        const index = text.indexOf(query);
        if (index !== -1) {
            return { 
                score: 1,
                indexes: [
                    { start: index, length: query.length }
                ]
            }
        }
    }
}

module.exports = { 
    SSearch: SSearch
};
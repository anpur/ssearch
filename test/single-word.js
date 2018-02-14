const mocha = require('mocha');
const expect = require('chai').expect;
const ssearch = require('../src/ssearch').SSearch;

describe.only('Single word', () => {
    it('Full match cases', () => {
        checkMatchFull(new ssearch(), '', '', 'word', 'word', 1);
        checkMatchFull(new ssearch(), '', '', 'word', 'Word', 1);
        checkMatchFull(new ssearch(), 'Some ', ' other stuff.', 'word', 'word', 1);
        checkMatchFull(new ssearch(), 'Some ', ' other stuff.', 'word', 'Word', 1);
    });

    it('One letter missing', () => {
        checkMatch('word', 'ord', 0.75);
        checkMatch('word', 'wor', 0.75);
        checkMatch('word', 'wrd', 0.75);
        checkMatch('triangular', 'riangular', 0.9);
        checkMatch('triangular', 'trianglar', 0.9);        
        checkMatch('triangular', 'triangula', 0.9);
    });

    it('Two letters mixed', () => {
        checkMatch('owrd', 'word', 0.875);
        checkMatch('wrod', 'word', 0.875);
        checkMatch('wodr', 'word', 0.875);
        
        checkMatch('rtiangular', 'triangular', 0.95);
        checkMatch('triangulra', 'triangular', 0.95);
        checkMatch('tirangular', 'triangular', 0.95);
    });

    it('Extra letter', () => {
        checkMatch('word', 'wo1rd', 0.875);
        checkMatch('triangular', 'triangul1ar', 0.95);
        checkMatch('triangular', 'triangula1r', 0.95);
        checkMatch('triangular', 'triangu1lar', 0.95);
        checkMatch('triangular', 'triang1ular', 0.95);
        checkMatch('triangular', 'trian1gular', 0.95);
        checkMatch('triangular', 'tria1ngular', 0.95);
        checkMatch('triangular', 'tri1angular', 0.95);
        checkMatch('triangular', 'tr1iangular', 0.95);
        checkMatch('triangular', 't1riangular', 0.95);
        checkNotMatch('triang1ula1r', 'triangular');
    });

    function checkMatch(query, word, score) {
        checkMatchFull(
            new ssearch(), 'Some text going here ', ' and something after', 
            query, word, score);
    }

    function checkNotMatch(query, word) {
        const s = new ssearch();
        const text = `Some text going here ${word} and something after`;    
        const match = s.search(text, query);    
        expect(match).to.be.null;
    }

    function checkMatchFull(s, prefix, postfix, query, word, score) {
        var message = '';
        
        try {
            var text = `${prefix}${word}${postfix}`;
            message = `Searching for '${word}' with '${query}' query in '${text}'`;        
            var match = s.search(text, query);        
            expect(match).to.exist;
            expect(match.score).to.be.equal(score);
            expect(match.indexes.length).to.be.equal(1);
            expect(text.substring(
                match.indexes[0].start,
                match.indexes[0].start + match.indexes[0].length))
                .to.be.equal(word);
        } catch(e) {
            const newError = new Error(`${message}\n${e}`);
            newError.stack = e.stack;
            throw newError;
        }
    }
});
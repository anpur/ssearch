const mocha = require('mocha');
const expect = require('chai').expect;
const ssearch = require('../src/ssearch').SSearch;

describe('Several words', () => {
    const threeWords = 'some text here';
    const threeWordsCamel = 'Some Text Here';
    const fiveWords = `And ${threeWords} too.`;

    it('Full match', () => {
        const s = new ssearch();
        const match = s.search(threeWords, threeWords);
        expect(match).to.be.deep.equal({
            score: 1,
            indexes: [
                { start: 0, length: threeWords.length }
            ]
        });
    });

    it('Full match different case: case insensetive', () => {
        const s = new ssearch();
        const match = s.search(threeWordsCamel, threeWords);
        expect(match).to.be.deep.equal({
            score: 1,
            indexes: [
                { start: 0, length: threeWords.length }
            ]
        });
    });

    it('Full match different case: case sensetive', () => {
        const s = new ssearch({ caseSensetive: true });
        const match = s.search(threeWordsCamel, threeWords);
        expect(match).to.be.null;
    });

    it('Partial match', () => {
        const s = new ssearch();
        const match = s.search(fiveWords, threeWords);
        expect(match).to.be.not.null;
        expect(match.score).to.be.equal(1);
        expect(match.indexes.length).to.be.equal(1);

        expect(fiveWords.substring(match.indexes[0].start, match.indexes[0].start + match.indexes[0].length))
            .to.be.equal(threeWords);
    });
});
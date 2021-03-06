'use strict';

const fs = require('fs');

const Molecule = require('../minimal').Molecule;

describe('Molecule', function () {
    
    it('fromSmiles', function () {
        testFromSmiles('C');
        testFromSmiles('COCOC');
        testFromSmiles('c1cc2cccc3c4cccc5cccc(c(c1)c23)c54');
        
        (function () {
            Molecule.fromSmiles('ABC');
        }).should.throw();
        
        function testFromSmiles(smiles) {
            const mol = Molecule.fromSmiles(smiles);
            Molecule.fromSmiles(mol.toSmiles()).getIDCode().should.equal(mol.getIDCode());
        }
    });

    it('medley', function () {
        const idcode = 'enYXNH@MHDAELem`OCIILdhhdiheCDlieKDdefndZRVVjjfjjfjihJBbb@@@';
        let mol = Molecule.fromIDCode(idcode);
        
        const molfile = mol.toMolfile();
        mol = Molecule.fromMolfile(molfile);
        mol.getIDCode().should.equal(idcode);
        
        const smiles = mol.toSmiles();
        mol = Molecule.fromSmiles(smiles);
        mol.getIDCode().should.equal(idcode);
    });

    it('toSVG', function () {
        const mol = Molecule.fromSmiles('CCOCCO');
        let svg = mol.toSVG(300, 150, 'myId');
        svg.should.containEql('width="300px" height="150px"');
        svg.should.containEql('myId:Bond:1-0');
        svg.should.containEql('myId:Atom:0');

        svg = mol.toSVG(300, 300, 'myId', {
            strokeWidth: 2,
            fontWeight: 'bold'
        });
        svg.should.containEql('font-weight="bold"');
        svg.should.containEql('stroke-width:2');
    });

    it('molfile V3', function () {
        const idcode = 'enYXNH@MHDAELem`OCIILdhhdiheCDlieKDdefndZRVVjjfjjfjihJBbb@@@';
        let mol = Molecule.fromIDCode(idcode);

        let molfileV3 = mol.toMolfileV3();
        mol = Molecule.fromMolfile(molfileV3);
        mol.getIDCode().should.equal(idcode);

        molfileV3 = mol.toMolfileV3();
        mol = Molecule.fromMolfile(molfileV3);
        mol.getIDCode().should.equal(idcode);
    });

    it('fromMolfileWithAtomMap', () => {
        const molfile = fs.readFileSync(__dirname + '/data/molfileWithHMap.mol', 'utf8');
        const result = Molecule.fromMolfileWithAtomMap(molfile);
        result.molecule.should.be.instanceOf(Molecule);
        result.map.length.should.equal(result.molecule.getAllAtoms());
        new Set(result.map).size.should.equal(result.molecule.getAllAtoms());

    });

    it('addMissingChirality', () => {
        let mol = Molecule.fromSmiles('CC(Cl)CC');
        mol.getChiralText().should.equal('unknown chirality');
        mol.addMissingChirality();
        mol.getChiralText().should.equal('racemate');

        mol = Molecule.fromSmiles('CC(Cl)CC');
        mol.addMissingChirality(Molecule.cESRTypeOr);
        mol.getChiralText().should.equal('this or other enantiomer');

        mol = Molecule.fromSmiles('CC(Cl)CC');
        mol.addMissingChirality(Molecule.cESRTypeAbs);
        mol.getChiralText().should.equal('this enantiomer');
    });

    it('getCanonizedIDCode', () => {
        let idcode = 'didH@@RYm^Fh@BHX@';
        let mol = Molecule.fromIDCode(idcode);
        mol.getCanonizedIDCode(Molecule.CANONIZER_DISTINGUISH_RACEMIC_OR_GROUPS).should.equal(idcode);
        mol.inventCoordinates();
        mol.getCanonizedIDCode(Molecule.CANONIZER_DISTINGUISH_RACEMIC_OR_GROUPS).should.equal(idcode);
    });
});

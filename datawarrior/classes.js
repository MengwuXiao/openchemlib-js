var classes = [
    'calc/ThreadMaster',

    'chem/prediction/ToxicityPredictor'
];

exports.copy = classes.map(getFilename);

var modified = [
];

exports.modified = modified.map(getFilename);

function getFilename(file) {
    return 'com/actelion/research/' + file + '.java';
}

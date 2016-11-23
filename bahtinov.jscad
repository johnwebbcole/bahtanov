// title      : bahtinov
// author     : John Cole
// license    : ISC License
// file       : bahtinov.jscad

/* exported main, getParameterDefinitions */

function getParameterDefinitions() {
    return [{
        name: 'resolution',
        type: 'choice',
        values: [0, 1, 2, 3, 4],
        captions: ['very low (6,16)', 'low (8,24)', 'normal (12,32)', 'high (24,64)', 'very high (48,128)'],
        initial: 0,
        caption: 'Resolution:'
    }, {
        name: 'expand',
        type: 'float',
        initial: '0',
        caption: 'Expand Diameter:'
    }, {
        name: 'expandHeight',
        type: 'float',
        initial: '0',
        caption: 'Add Height:'
    }, {
        name: 'mask',
        type: 'choice',
        values: ['55', '80', '110'],
        captions: ['F50 Guidscope (60mm)', 'Orion ST80 (110mm)', 'Vixen VMC110L (126mm)'],
        initial: '55',
        caption: 'Mask:'
    }];
}

function main(params) {

    var resolutions = [
        [6, 16],
        [8, 24],
        [12, 32],
        [24, 64],
        [48, 128]
    ];
    CSG.defaultResolution3D = resolutions[params.resolution][0];
    CSG.defaultResolution2D = resolutions[params.resolution][1];
    util.init(CSG);

    var mask = Mask[params.mask](); // eslint-disable-line no-undef
    Object.assign(mask, {
        outsideDiameter: mask.outsideDiameter + params.expand,
        insideDiameter: mask.insideDiameter + params.expand,
        height: mask.height + params.expandHeight
    });

    var bahtanovMask = mask.getMask().color('blue');
    var s = bahtanovMask.size();
    var c = Parts.Tube(mask.outsideDiameter, mask.insideDiameter, mask.height).snap(bahtanovMask, 'z', 'outside-').color('green');

    var extension = () => Parts.Tube(mask.outsideDiameter, s.x - 1, s.z).color('orange');
    var cutter = Parts.Tube(s.x + 10, mask.outsideDiameter, mask.height).color('red');

    var channel = Parts.Tube(mask.outsideDiameter, mask.outsideDiameter - 3, 4)
        .snap(c, 'z', 'inside+')
        .translate([0, 0, -2])
        .fillet(-1, 'z+')
        .fillet(-1, 'z-')
        .color('red');

    var notch = Parts.Cube([mask.outsideDiameter + 1, 2, mask.height * 2 / 3])
        .align(c, 'xy')
        .snap(c, 'z', 'inside+')
        .color('red');

    var angles = function (a) {
        var r = [0];
        var i = 0;
        var end = 180 - a;
        while (i < end) r.push(i += a);
        return r;
    };

    return union([
        bahtanovMask.unionIf(extension, s.x < mask.insideDiameter).subtract(cutter),
        c,
        c.fillet(1, 'z-'),
        // channel,
        // notch
    ]).subtract(
        union([
            channel,
            union(angles(mask.angle).map(a => notch.rotateZ(a)))
        ]));
}





// ********************************************************
// Other jscad libraries are injected here.  Do not remove.
// Install jscad libraries using NPM
// ********************************************************
// include:js
// endinject

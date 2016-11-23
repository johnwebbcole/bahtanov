// title      : bahtinov
// author     : John Cole
// license    : ISC License
// file       : bahtinov.jscad

/* exported main, getParameterDefinitions */

/**
 * `OpenJSCAD` hook to create the parameters area.
 * @return {Array} An array of OpenJSCAD parameters.
 */
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

/**
 * OpenJSCAD entry point
 * @param  {Object} params Paramters object with the paramters from the UI.
 * @return {CSG | CAG}        Typically a `CSG` object or a `CAG` 2D object.
 */
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

    /// Get a mask from the availble object.  These are created and added
    /// to the global `Mask` obeject in their own files.
    var mask = Mask[params.mask](); // eslint-disable-line no-undef

    /// Add the paramters from the web page to customize the mask.
    Object.assign(mask, {
        outsideDiameter: mask.outsideDiameter + params.expand,
        insideDiameter: mask.insideDiameter + params.expand,
        height: mask.height + params.expandHeight
    });

    // Create the mask from the generator.  Using a function here saves us
    // from creating all of the masks at load time.  This is good becuase the
    // masks are complex. Only the one we want is createad.
    var bahtanovMask = mask.getMask().color('blue');
    var s = bahtanovMask.size();

    /// Create the tube around the mask, the `insideDiameter` is the measurement
    /// that matches the outside of the scope.
    var c = Parts.Tube(mask.outsideDiameter, mask.insideDiameter, mask.height).snap(bahtanovMask, 'z', 'outside-').color('green');

    /// Create a function that will return a tube that matches the mask height.  If the
    /// mask is smaller than the outside of the scope, then this extension will fill the gap.
    var extension = () => Parts.Tube(mask.outsideDiameter, s.x - 1, s.z).color('orange');

    /// Create a `cutter`, which is a tube that will subtract any overhang beyond
    /// the `outsideDiameter`.
    var cutter = Parts.Tube(s.x + 10, mask.outsideDiameter, mask.height).color('red');

    /// Create a rounded tube so a rubber band can placed around the mask.  THis
    /// `channel` will be subtracted from the `c` tube.
    var channel = Parts.Tube(mask.outsideDiameter, mask.outsideDiameter - 3, 4)
        .snap(c, 'z', 'inside+')
        .translate([0, 0, -2])
        .fillet(-1, 'z+')
        .fillet(-1, 'z-')
        .color('red');

    /// Notches will be cut out of the tube to provide some flexibility.
    var notch = Parts.Cube([mask.outsideDiameter + 1, 2, mask.height * 2 / 3])
        .align(c, 'xy')
        .snap(c, 'z', 'inside+')
        .color('red');

    /**
     * A function to create an array of angles below 180 degrees.
     * @param  {Number} a Size of each angle.
     * @return {Array}   Array of angles, starting with `0` under 180 degrees.
     */
    var angles = function (a) {
        var r = [0];
        var i = 0;
        var end = 180 - a;
        while (i < end) r.push(i += a);
        return r;
    };

    /// Put everything together
    return union([
        bahtanovMask.unionIf(extension, s.x < mask.insideDiameter).subtract(cutter),
        c,
        c.fillet(1, 'z-')
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

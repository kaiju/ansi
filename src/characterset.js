/**
 * Represents a textmode character set
 *
 * @param {string} name Character Set Name
 * @param {string} description Character Set Description
 * @param {int} characterWidth Width of each character in pixels
 * @param {int} characterHeight Height of each character in pixels
 * @param {array} characters Character data, indexed by binary value, encoded in hex
 */
export default function characterSet(name, description, characterWidth, characterHeight, characters) {
    this.name = name;
    this.description = description;
    this.characterWidth = characterWidth;
    this.characterHeight = characterHeight;
    this.characters = [];

    // Hex -> Binary so we're not trying to convert this on the fly when rendering.
    for (var i=0;i<characters.length;i++) this.characters[i] = this.hexToBinaryString(characters[i]);
}

/**
 * Convert a hex string to a binary string
 *
 * @param {string} hexString The string to convert from hex to binary
 *
 * @return {string} binary string
 */
characterSet.prototype.hexToBinaryString = function(hexString) {
    var bin = ""
    for (var i=0;i<hexString.length;i++) {
        var chunk = parseInt("0x"+hexString[i], 16).toString(2)
        while(chunk.length < 4) chunk = "0" + chunk;
        bin += chunk
    }
    return bin;
}

class Offender {
    constructor(url) {
        this.url = url;
        this.length = 1;
    }
}

class OffendersList {
    constructor(array) {
        this.array = [];
        if(array) this.populate(array);
    };

    isInArray(prop, val) {
        return this.array.map(function (element) {return element[prop];}).indexOf(val);
    };

    sortByProp(prop, back) {
        back = back || false;
        this.array.sort(function(a,b) {

            // least to greatest
            if (!back && a[prop] < b[prop]) return -1;
            else if (!back && a[prop] > b[prop]) return 1;

            // greatest to least
            else if (back && a[prop] > b[prop]) return -1;
            else if (back && a[prop] < b[prop]) return 1;
            
            // a must be equal to b
            return 0;
        });

    };

    addItem(obj) {
        this.array.push(obj);
    };

    populate(array) {
        array.forEach((resource) => {
            var indexOfResource = this.isInArray('url', resource.url);
            if(indexOfResource !== -1) this.array[indexOfResource].length++;
            else this.addItem(new Offender(resource.url));
        });
    }
}

module.exports.List = OffendersList;
module.exports.Offender = Offender;
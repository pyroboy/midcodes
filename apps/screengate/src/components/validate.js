import Validator from "fastest-validator";

export class schema{
    constructor(schema) {
        this.check  = new Validator({
            messages: {
                stringMin: "too short",
                required: "**required**",
                stringEmpty: "**required**",
            }
        }).compile(schema);
      }
    
      validate(vk) {
        let c = this.check(vk);
        let errors = {list: Array.isArray(c) ? c : [],
                    where:(field)=>{ return errors.list.find(e => e['field'] === field)} }; // data from check function
        let validity =  errors.list.map(e => e.field); // map invalid fields
        let valid = validity.length === 0 ? true : false; // true if all fields valid
        return { v: errors,
                a: validity,
                l: valid }
    }
}


import React from "react";
import Joi from "joi-browser";
import { Button, FormGroup, Label, Input as ReactstrapInput } from "reactstrap";
import Input from "./input";
import CheckBox from "./checkbox";
import Select from "./select";
import Toast from "./toast";
import LoadingSpinner from "../../Components/PageSpinner";
import _ from "lodash";

import FileInput from "./fileInput";

class Form extends Toast {
  state = {
    data: {},
    errors: {},
    lock: false,
  };

  //validate the entire form
  validate = () => {
    const options = { abortEarly: false };
    const { error } = Joi.validate(this.state.data, this.schema, options);

    if (!error) return null;
    //to map joi error array to our errors object
    const errors = {};
    for (let item of error.details) errors[item.path[0]] = item.message;
    return errors;
  };
  //validate only one input
  validateProperty = ({ name, value }) => {
    const [displayName] = name.split(".").slice(-1);

    const obj = { [displayName]: value }; // [name](computed property) ==> username as a key or somethig, value= value of it.
    // const schema = { [name]: this.schema[name] };
    const schema = {
      [displayName]: _.get(this.nestedSchema, name)
        ? _.get(this.nestedSchema, name)
        : _.get(this.schema, name),
    };
    const { error } = Joi.validate(obj, schema);
    return error ? error.details[0].message : null;
  };

  handleSubmit = (e) => {
    e.preventDefault();
    const errors = this.validate();
    console.log("Validation ERRORS", errors);
    this.setState({ errors: errors || {} }); //if trusy errors eles empty object
    if (errors) return;
    this.doSubmit();
  };

  // when the user types to change the value of the state accordingly
  handleChange = ({ currentTarget: input }, callback = null) => {
    //to validate single input when we type
    const errors = { ...this.state.errors };
    const errorMessage = this.validateProperty(input);
    // if (errorMessage) errors[input.name] = errorMessage;
    if (errorMessage) _.set(errors, input.name, errorMessage);
    else _.set(errors, input.name, null);

    if (callback) {
      callback(input.value, this.state.data);
    }
    const data = { ...this.state.data };
    // data[input.name] = input.value; //dynamically access .. property
    _.set(data, input.name, input.value);
    this.setState({ data, errors });
  };

  renderButton(label, loader = false) {
    return (
      !this.props.disabled && (
        <Button size="sm" block disabled={this.validate || this.props.loading}>
          {this.props.loading || loader ? <LoadingSpinner /> : label}
        </Button>
      )
    );
  }
  renderButton2(label, loader = false) {
    return (
      !this.props.disabled && (
        <Button color="primary" disabled={this.validate || this.props.loading}>
          {this.props.loading || loader ? <LoadingSpinner /> : label}
        </Button>
      )
    );
  }

  renderSelect(name, label, options, optionsFrom = "client") {
    var props = {};
    if (typeof name === "object") {
      props = {
        optionsFrom: "client",
        ...name,
      };
    } else {
      props.name = name;
      props.label = label;
      props.options = options;
      props.optionsFrom = optionsFrom;
    }
    const { data, errors } = this.state;
    return (
      <Select
        {...props}
        size="sm"
        name={props.name}
        value={_.get(data, props.name)}
        label={props.label}
        onChange={
          props.callback
            ? (target) => this.handleChange(target, props.callback)
            : this.handleChange
        }
        error={_.get(errors, props.name)}
        placeholder={props.label}
        invalid={_.get(errors, props.name) ? true : false}
        disabled={this.props.disabled}
      />
    );
  }

  handleCheckBoxChange = (name, label) => (e) => {
    const data = { ...this.state.data };
    if (e.target.checked) {
      data[name].push(label);
    } else {
      data[name] = data[name].filter((e) => e !== label);
    }
    this.setState({ data });
    console.log(label, e.target.checked);
  };

  renderCheckbox2(name, label) {
    return (
      <FormGroup check>
        <Label check>
          <ReactstrapInput
            type="checkbox"
            id="checkbox2"
            onChange={this.handleCheckBoxChange(name, label)}
          />
          {label}
        </Label>
      </FormGroup>
    );
  }

  renderCheckbox(name, label) {
    var props = {};
    if (typeof name === "object") {
      props = {
        ...name,
      };
    } else {
      props.name = name;
      props.label = label;
    }

    const { data, errors } = this.state;
    return (
      <CheckBox
        {...props}
        label={props.label}
        name={props.name}
        value={_.get(data, props.name)}
        checked={_.get(data, props.name)}
        onChange={({ currentTarget: { name, checked } }) =>
          this.handleChange({ currentTarget: { name, value: checked } })
        }
        error={_.get(errors, props.name)}
        invalid={_.get(errors, props.name) ? true : false}
      />
    );
  }

  renderInput2(name, placeholder = "", type = "text") {
    const { data } = this.state;
    return (
      <ReactstrapInput
        type={type}
        name={name}
        value={_.get(data, name)}
        onChange={this.handleChange}
        placeholder={placeholder}
      />
    );
  }

  renderInput(name, label, type = "text", className = "") {
    var props = {};
    if (typeof name === "object") {
      props = {
        ...name,
      };
    } else {
      props.name = name;
      props.label = label;
      props.type = type;
      props.className = className;
    }
    const { data, errors } = this.state;

    return (
      <Input
        {...props}
        size="sm"
        type={props.type}
        className={props.className}
        name={props.name}
        value={_.get(data, props.name)}
        label={props.label}
        onChange={
          props.callback
            ? (target) => this.handleChange(target, props.callback)
            : this.handleChange
        }
        error={_.get(errors, props.name)}
        placeholder={props.label}
        invalid={_.get(errors, props.name) ? true : false}
        disabled={this.props.disabled}
      />
    );
  }

  resetForm() {
    this.setState(() => this.initialState);
  }

  getErrors = (errors) => {
    if (typeof errors === "string") {
      return errors;
    } else {
      for (var key in errors) {
        if (errors.hasOwnProperty(key)) {
          return errors[key][0];
        }
      }
    }
  };

  clearForm() {
    var data = {};
    for (var prop in this.state.data) {
      data[prop] = "";
    }
    this.setState({ data, lock: true });
  }

  handleToggleLineModal = () => {
    this.setState((prevState) => ({
      lineModal: !prevState.lineModal,
      selectedLine: "",
    }));
  };

  handleLineSubmit = (line, type = "lines") => {
    let count = this.state.lineCounter;
    let data = { ...JSON.parse(JSON.stringify(this.state.data)) };
    if (line.id) {
      let index = data[type].findIndex((l) => l.id === line.id);
      try {
        data[type][index] = line;
      } catch (error) {}
    } else {
      line["id"] = count;
      count++;
      data[type].push(line);
    }
    this.setState({ data, lineCounter: count });
  };

  handleLineEdit = (line) => {
    this.setState({
      selectedLine: line,
    });
  };

  handleLineDelete = (line, type = "lines") => {
    const data = { ...this.state.data };
    let index = data[type].findIndex((l) => l.id === line.id);
    data[type].splice(index, 1);
    this.setState({ data });
  };

  /**
   * This function does the actual extraction logic
   *
   * @param {Object} line single line object
   * @param {*} data key:value, key property to be extracted, value the list of objects from which the key gets its object/data.
   *
   *
   * temp[key] = data[key].find((obj) => obj.id === line[key]);
   * the above line for property "warehouse" is the same us temp.warehouse = this.props.warehouses.find((warehouse) => warehouse.id === line.warehouse
   */
  getExtractedLine(line, data) {
    var temp = {};
    for (var key in data) {
      temp[key] = data[key].find((obj) => obj.id === line[key]);
    }
    return temp;
  }

  /**
   * this function EXTRACT lines prpertires with only id to their data
   * for example { item:"1", warehouse:"1"} to {item:{id:"1":name:"item"}}

   * @param {Array} lines list of line objects with properties that only have "id"
   * example [{lot_number: "",
      quantity_received: "",
      total_amount: "",
      unit_price: "",
      remark: "",
      item: "1",
      unit_measurement: "1",
      warehouse: "1",
      bin: "1"} {...}]

      Here bin, unit_measurement, warehouse and item properties have to get their object in order to display on line table correclty
   * @param {Object} data  key:value, key property to be extracted, value the list of objects from which the key gets its object/data.
      example   
      data = {
          item: this.props.items,
          warehouse: this.props.warehouses,
          bin: this.props.bins,
          unit_measurement: this.props.unitMeasurements,
      };
      
      lines[0].Object.keys(data)[0] !== "object") 
      if the first line object of the key to be extracted is not object do the extraction
      the same as lines[0].warehouse !== "object" for property "warehouse"
   */
  getLineTableData(lines, data) {
    if (
      lines.length > 0 &&
      typeof lines[0][Object.keys(data)[0]] !== "object"
    ) {
      return lines.map((line) => ({
        ...line,
        ...this.getExtractedLine(line, data),
      }));
    } else {
      return lines;
    }
  }

  handleUploadChange = (event) => {
    this.setState({
      selectedFile: event.target.files[0],
      loaded: 0,
    });
  };

  renderFileInput(name, label) {
    return (
      <FileInput
        name={name}
        label={label}
        onChange={this.handleUploadChange}
        onClick={this.handleUpload}
        value={this.state.loaded}
        selectedFile={this.state.selectedFile}
      />
    );
  }
  getFormData(file) {
    const data = new FormData();
    data.append("file", file);
    return data;
  }
  getProgressConfig() {
    const config = {
      onUploadProgress: (ProgressEvent) => {
        this.setState({
          loaded: (ProgressEvent.loaded / ProgressEvent.total) * 100,
        });
      },
    };
    return config;
  }
}

export default Form;

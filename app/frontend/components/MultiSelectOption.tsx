import { FormGroup, Input, Label } from "reactstrap";
import React from "react";

type Props = {
  name: string;
  // Available items
  choices: string[];
  // Selected items
  values: string[];
  onConfigChange: (configDiff: { [key: string]: string[] }) => void;
};

export default function MultiSelectOption({ name, choices, values, onConfigChange }: Props) {
  return (
    <div key={name}>
      <span className="me-2">
        <code>--{name}=</code>
      </span>
      {choices.map((choice: string) => {
        const key = `${name}-${choice}`;
        const onChange: React.ChangeEventHandler<HTMLInputElement> = (e) => {
          const updatedValues = [...values]; // shallow copy
          if (e.target.checked && !values.includes(choice)) {
            onConfigChange({
              [name]: [...values, choice],
            });
          } else if (!e.target.checked && values.includes(choice)) {
            onConfigChange({
              [name]: values.filter((c) => c != choice),
            });
          }
        };
        return (
          <FormGroup check inline key={key} className="me-1">
            <Input type="checkbox" id={key} checked={values.includes(choice)} onChange={onChange} />
            <Label check for={key}>
              <code>{choice}</code>
            </Label>
          </FormGroup>
        );
      })}
    </div>
  );
}

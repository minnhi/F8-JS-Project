// Đối tượng Validator
function Validator(options) {
  var selectorRules = {};
  // Hàm lấy ra element cha (.form-group) để thực hiện thông báo lỗi
  function getParent(element, selector) {
    while (element.parentElement) {
      if (element.parentElement.matches(selector)) {
        return element.parentElement;
      }
      element = element.parentElement;
    }
  }
  // Hàm lấy các phần tử input và error
  function getInputAndErrorElements(rule) {
    var inputElement = formElement.querySelector(rule.selector);
    var errorElement = getParent(
      inputElement,
      options.formGroupSelector
    ).querySelector(options.errorSelector);
    return { inputElement, errorElement };
  }

  // Hàm thực hiện validate: kiểm tra giá trị input
  function validate(inputElement, rule, errorElement) {
    var errorMessage;
    var rules = selectorRules[rule.selector];
    // Lặp qua từng rule để xử lý
    for (let i = 0; i < rules.length; i++) {
      // lấy ra thuộc tính type của inputElement
      switch (inputElement.type) {
        // Lệnh xử lý nếu type là radio hoặc checkbox
        case "radio":
        case "checkbox":
          errorMessage = rules[i](
            formElement.querySelector(rule.selector + ":checked")
          );
          break;
        // Lệnh xử lý nếu type không phải là radio hoặc checkbox
        default:
          errorMessage = rules[i](inputElement.value);
      }

      // Có lỗi => Dừng xử lý
      if (errorMessage) {
        break;
      }
    }

    if (errorMessage) {
      errorElement.innerText = errorMessage;
      getParent(inputElement, options.formGroupSelector).classList.add(
        "invalid"
      );
    } else {
      errorElement.innerText = "";
      getParent(inputElement, options.formGroupSelector).classList.remove(
        "invalid"
      );
    }
    // Trả về giá trị boolean của errorMessage
    return !errorMessage;
  }

  // Lấy Element của form cần validate
  var formElement = document.querySelector(options.form);
  if (formElement) {
    // Lắng nghe sự kiện onsubmit (Khi submit form)
    formElement.onsubmit = function (e) {
      // Ngăn chặn hành động mặc định khi submit form
      e.preventDefault();

      var isFormValid = true;

      // Kiểm tra valid tất cả các trường input
      options.rules.forEach(function (rule) {
        var { inputElement, errorElement } = getInputAndErrorElements(rule);
        var isValid = validate(inputElement, rule, errorElement);
        if (!isValid) {
          isFormValid = false; // Kỹ thuật đặt cờ hiệu
        }
      });
      // Kiểm tra cờ hiệu
      if (isFormValid) {
        // Cờ ở trạng thái true
        // Trường hợp submit với Javascript
        if (typeof options.onSubmit === "function") {
          var enableInputs = formElement.querySelectorAll("[name]");
          var formValues = Array.from(enableInputs).reduce(function (
            values,
            input
          ) {
            switch (input.type) {
              case "radio":
                values[input.name] = formElement.querySelector(
                  'input[name="' + input.name + '"]:checked'
                ).value;
                break;
              case "checkbox":
                if (!input.matches(":checked")) {
                  values[input.name] = "";
                  return values;
                }
                if (!Array.isArray(values[input.name])) {
                  values[input.name] = [];
                }
                values[input.name].push(input.value);
                break;
              case "file":
                values[input.name] = input.files;
                break;
              default:
                values[input.name] = input.value;
            }

            return values;
          },
          {});
          options.onSubmit(formValues);
        }
        // Trường hợp submit với hành vi mặc định
        else {
          formElement.submit();
        }
      }
    };

    // Lặp qua mỗi rules và xử lý (lắng nghe sự kiện blur, oninput, ...)
    options.rules.forEach(function (rule) {
      if (Array.isArray(selectorRules[rule.selector])) {
        selectorRules[rule.selector].push(rule.test);
      } else {
        selectorRules[rule.selector] = [rule.test];
      }
      // Chỉ lấy errorElement từ hàm getInputAndErrorElements
      var { errorElement } = getInputAndErrorElements(rule);
      // Xử lý trường hợp radio, checkbox có nhiều lựa chọn
      var inputElements = formElement.querySelectorAll(rule.selector);
      Array.from(inputElements).forEach(function (inputElement) {
        // Xử lý trường hợp blur ra khỏi input
        inputElement.onblur = function () {
          validate(inputElement, rule, errorElement);
        };

        // Xử lý mỗi khi nhập vào input
        inputElement.oninput = function () {
          errorElement.innerText = "";
          getParent(inputElement, options.formGroupSelector).classList.remove(
            "invalid"
          );
        };
      });
    });
  }
}

// Định nghĩa rules (ràng buộc, điều kiện)
// Nguyên tắc:
// 1: Lỗi => Thông báo lỗi
// 2: Hợp lệ => Undefined
Validator.isRequired = function (selector, message) {
  return {
    selector: selector,
    test: function (value) {
      return value ? undefined : message || `Vui lòng nhập trường này`;
    },
  };
};
Validator.isEmail = function (selector, message) {
  return {
    selector: selector,
    test: function (value) {
      const emailRegex =
        /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/;
      return emailRegex.test(value)
        ? undefined
        : message || "Trường này phải là email";
    },
  };
};
Validator.minLength = function (selector, min, message) {
  return {
    selector: selector,
    test: function (value) {
      return value.length >= min
        ? undefined
        : message || `Vui lòng nhập tối thiểu ${min} ký tự`;
    },
  };
};

Validator.isConfirmed = function (selector, getConfirmVlaue, message) {
  return {
    selector: selector,
    test: function (value) {
      return value === getConfirmVlaue()
        ? undefined
        : message || "Giá trị nhập vào không chính xác";
    },
  };
};

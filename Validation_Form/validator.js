// Đối tượng Validator
function Validator(options) {
  var selectorRules = {};

  // Hàm lấy ra element cha (.form-group - dùng selector) để hiển thị thông báo lỗi
  function getParent(element, selector) {
    while (element.parentElement) {
      if (element.parentElement.matches(selector)) {
        return element.parentElement;
      }
      element = element.parentElement;
    }
  }

  // Hàm lấy các phần tử input và phần tử thông báo lỗi (error)
  function getInputAndErrorElements(rule) {
    var inputElement = formElement.querySelector(rule.selector);
    var errorElement = getParent(
      inputElement,
      options.formGroupSelector
    ).querySelector(options.errorSelector);
    return { inputElement, errorElement };
  }

  // Hàm thực hiện kiểm tra (validate): kiểm tra giá trị input
  function validate(inputElement, rule, errorElement) {
    var errorMessage;
    var rules = selectorRules[rule.selector];

    // Lặp qua từng rule để xử lý
    for (let i = 0; i < rules.length; i++) {
      // lấy ra thuộc tính type của inputElement
      switch (inputElement.type) {
        case "radio":
        case "checkbox":
          // Lệnh xử lý nếu type là radio hoặc checkbox
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

    // Hiển thị thông báo lỗi (nếu có)
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

    return !errorMessage; // Trả về kết quả kiểm tra ở dạng boolean
  }

  // Lấy element của form cần validate
  var formElement = document.querySelector(options.form);
  if (formElement) {
    // Lắng nghe sự kiện submit
    formElement.onsubmit = function (e) {
      e.preventDefault(); // Ngăn chặn hành vi mặc định khi submit

      var isFormValid = true;

      // Kiểm tra tất cả các trường input
      options.rules.forEach(function (rule) {
        var { inputElement, errorElement } = getInputAndErrorElements(rule);
        var isValid = validate(inputElement, rule, errorElement);
        if (!isValid) {
          isFormValid = false; // Đặt cờ hiệu
        }
      });

      // Nếu form hợp lệ
      if (isFormValid) {
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
          options.onSubmit(formValues); // Gọi hàm onSubmit với giá trị form
        } else {
          formElement.submit(); // Submit theo hành vi mặc định
        }
      }
    };

    // Lặp qua mỗi rule và xử lý (lắng nghe sự kiện blur và input)
    options.rules.forEach(function (rule) {
      if (Array.isArray(selectorRules[rule.selector])) {
        selectorRules[rule.selector].push(rule.test);
      } else {
        selectorRules[rule.selector] = [rule.test];
      }

      // Lấy các element input (radio, checkbox)
      var inputElements = formElement.querySelectorAll(rule.selector);
      Array.from(inputElements).forEach(function (inputElement) {
        var { errorElement } = getInputAndErrorElements(rule);

        // Xử lý khi blur khỏi input
        inputElement.onblur = function () {
          validate(inputElement, rule, errorElement);
        };

        // Xử lý khi người dùng nhập vào input
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

// Định nghĩa các rules kiểm tra
// Nguyên tắc:
// 1: Lỗi => Thông báo lỗi
// 2: Hợp lệ => Undefined
Validator.isRequired = function (selector, message) {
  return {
    selector: selector,
    test: function (value) {
      return value ? undefined : message || "Vui lòng nhập trường này";
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

Validator.isConfirmed = function (selector, getConfirmValue, message) {
  return {
    selector: selector,
    test: function (value) {
      return value === getConfirmValue()
        ? undefined
        : message || "Giá trị nhập vào không chính xác";
    },
  };
};

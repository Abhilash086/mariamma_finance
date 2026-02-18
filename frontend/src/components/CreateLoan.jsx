import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { usePopupContext } from "../context/PopupContext";
import Popup from "./Popup";
import Loader from "./Loader";

const HEADER_VALUE = import.meta.env.VITE_API_HEADER_VALUE;
const CREATE_LOAN = import.meta.env.VITE_CREATE_LOAN;

const CreateLoanPage = () => {
  const { showPopup, setShowPopup, setType, setMessage } = usePopupContext();
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    setValue,
    formState: { errors },
  } = useForm({
    defaultValues: {
      hpNumber: "",
      loanAmount: "",
      interestRate: 0,
      loanTerm: "",
      purpose: "",
      interestAmount: "",
      totalPayable: "",
      monthlyEMI: "",
    },
  });

  const loanAmount = parseFloat(watch("loanAmount"));
  const interestRate = parseFloat(watch("interestRate"));
  const loanTerm = parseFloat(watch("loanTerm"));
  const totalPayable = parseFloat(watch("totalPayable"));
  const agreement = watch("agreement");
  const hpEntry = watch("hpEntry");
  const hpCancellation = watch("hpCancellation");
  const insurance = watch("insurance");
  const agentCommision = watch("agentCommision");
  const to = watch("to");
  // const officeRent = watch("officeRent");
  // const officeManagementSalary = watch("officeManagementSalary");
  // const officeOtherExpense = watch("officeOtherExpense");
  // const officeBankAuditchanges = watch("officeBankAuditChanges");
  // const disbursedAmount = watch("actualAmount");

  useEffect(() => {
    if (!loanAmount || !interestRate || !loanTerm) {
      setValue("interestAmount", "");
      setValue("totalPayable", "");
      setValue("monthlyEMI", "");
      return;
    }

    const interestAmount = (loanAmount * loanTerm * interestRate) / 100;
    const totalPayable = loanAmount + interestAmount;
    const monthlyEMI = totalPayable / loanTerm;

    setValue("interestAmount", interestAmount.toFixed(2));
    setValue("totalPayable", totalPayable.toFixed(2));
    setValue("monthlyEMI", monthlyEMI.toFixed(2));
  }, [loanAmount, interestRate, watch("loanTerm"), setValue]);

  const onSubmit = async (data) => {
    data.initialPay = totalPayable;
    setLoading(true);
    console.log(data);

    try {
      const res = await fetch(CREATE_LOAN, {
        method: "POST",
        headers: {
          "x-api-key": HEADER_VALUE,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const result = await res.json();

      if (!result?.status || result.status !== "success") {
        throw new Error(result?.message || "Loan creation failed.");
      }

      setType("success");
      setMessage("Loan created successfully!");
      reset();
    } catch (err) {
      setType("error");
      setMessage(
        err.message || "Something went wrong while creating the loan."
      );
    } finally {
      setLoading(false);
      setShowPopup(true);
    }
  };

  useEffect(() => {
    if (!totalPayable) return;

    const finalAmount = (
      parseFloat(loanAmount) -
      (parseFloat(agreement || 0) +
        parseFloat(hpEntry || 0) +
        parseFloat(hpCancellation || 0) +
        parseFloat(insurance || 0) +
        parseFloat(to || 0) +
        parseFloat(agentCommision || 0))
    )
      // parseFloat(officeRent || 0) +
      // parseFloat(officeManagementSalary || 0) +
      // parseFloat(officeOtherExpense || 0) +
      // parseFloat(officeBankAuditchanges || 0)
      .toFixed(2);

    setValue("actualAmount", finalAmount);
  }, [
    totalPayable,
    loanAmount,
    agreement,
    hpEntry,
    hpCancellation,
    insurance,
    to,
    agentCommision,
    // officeRent,
    // officeManagementSalary,
    // officeOtherExpense,
    // officeBankAuditchanges,
    setValue,
  ]);

  if (loading) return <Loader />;

  return (
    <div className="bg-gradient-to-b w-full max-w-6xl from-gray-900 via-gray-800 to-gray-900 min-h-screen text-white flex flex-col items-center p-6">
      <main className="w-full max-w-6xl bg-gray-800 rounded-lg shadow-lg p-8 mt-10">
        <div className="text-center mb-6">
          <h2 className="text-3xl font-bold text-teal-300">Apply Loan</h2>
        </div>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="grid grid-cols-1 md:grid-cols-2 gap-6"
        >
          <div>
            <label className="block mb-1">HP Number</label>
            <input
              type="text"
              placeholder="HP Number"
              {...register("hpNumber", {
                required: "Customer ID is required.",
              })}
              className="p-2 rounded bg-gray-700 w-full"
            />
            {errors.hpNumber && (
              <p className="text-red-400 text-sm mt-1">
                {errors.hpNumber.message}
              </p>
            )}
          </div>

          <div>
            <label className="block mb-1">Loan Amount</label>
            <input
              type="number"
              placeholder="Loan Amount"
              onWheel={(e) => e.target.blur()}
              {...register("loanAmount", {
                required: "Loan amount is required.",
                min: {
                  value: 1,
                  message: "Loan amount must be greater than 0.",
                },
              })}
              className="p-2 rounded bg-gray-700 w-full"
            />
            {errors.loanAmount && (
              <p className="text-red-400 text-sm mt-1">
                {errors.loanAmount.message}
              </p>
            )}
          </div>

          <div>
            <label className="block mb-1">Interest Rate</label>
            <input
              placeholder="Interest Rate"
              type="number"
              onWheel={(e) => e.target.blur()}
              {...register("interestRate")}
              className="p-2 rounded bg-gray-700 w-full"
            />
          </div>

          <div>
            <label className="block mb-1">Loan Term</label>
            <select
              {...register("loanTerm", { required: "Loan term is required." })}
              className="p-2 rounded bg-gray-700 w-full"
            >
              <option value="">Select Loan Term</option>
              <option value="10">10 Months</option>
              <option value="12">12 Months</option>
              <option value="15">15 Months</option>
              <option value="18">18 Months</option>
              <option value="24">24 Months</option>
              <option value="36">36 Months</option>
            </select>
            {errors.loanTerm && (
              <p className="text-red-400 text-sm mt-1">
                {errors.loanTerm.message}
              </p>
            )}
          </div>

          <div>
            <label className="block mb-1">Interest Amount</label>
            <input
              type="text"
              readOnly
              value={
                watch("interestAmount")
                  ? `₹${parseFloat(watch("interestAmount")).toLocaleString(
                      "en-IN"
                    )}`
                  : ""
              }
              placeholder="Interest Amount"
              className="p-2 rounded bg-gray-700 w-full"
            />
          </div>

          <div>
            <label className="block mb-1">Monthly EMI</label>
            <input
              type="text"
              readOnly
              value={
                watch("monthlyEMI")
                  ? `₹${parseFloat(watch("monthlyEMI")).toLocaleString(
                      "en-IN"
                    )}`
                  : ""
              }
              placeholder="Monthly EMI"
              className="p-2 rounded bg-gray-700 w-full"
            />
          </div>

          <div className="md:col-span-2">
            <textarea
              placeholder="Purpose"
              rows="3"
              {...register("purpose", { required: "Purpose is required." })}
              className="p-2 rounded bg-gray-700 w-full"
            />
            {errors.purpose && (
              <p className="text-red-400 text-sm mt-1">
                {errors.purpose.message}
              </p>
            )}
          </div>

          <div>
            <label className="block mb-1">Agreement</label>
            <input
              placeholder="Agreement"
              type="number"
              onWheel={(e) => e.target.blur()}
              {...register("agreement")}
              className="p-2 rounded bg-gray-700 w-full"
            />
          </div>
          <div>
            <label className="block mb-1">HP Entry</label>
            <input
              placeholder="HP Entry"
              type="number"
              onWheel={(e) => e.target.blur()}
              {...register("hpEntry")}
              className="p-2 rounded bg-gray-700 w-full"
            />
          </div>

          <div>
            <label className="block mb-1">HP Cancellation</label>
            <input
              placeholder="HP Cancellation"
              type="number"
              onWheel={(e) => e.target.blur()}
              {...register("hpCancellation")}
              className="p-2 rounded bg-gray-700 w-full"
            />
          </div>

          <div>
            <label className="block mb-1">Insurance</label>
            <input
              placeholder="Insurance"
              type="number"
              onWheel={(e) => e.target.blur()}
              {...register("insurance")}
              className="p-2 rounded bg-gray-700 w-full"
            />
          </div>
          <div>
            <label className="block mb-1">Agent Commision</label>
            <input
              placeholder="Agent Commision"
              type="number"
              onWheel={(e) => e.target.blur()}
              {...register("agentCommision")}
              className="p-2 rounded bg-gray-700 w-full"
            />
          </div>
          {/* <div>
            <label className="block mb-1">Office Rent</label>
            <input
              placeholder="Office Rent"
              type="number"
              {...register("officeRent")}
              className="p-2 rounded bg-gray-700 w-full"
            />
          </div>
          <div>
            <label className="block mb-1">Office Management Salary</label>
            <input
              placeholder="Office Management Salary"
              type="number"
              {...register("officeManagementSalary")}
              className="p-2 rounded bg-gray-700 w-full"
            />
          </div>
          <div>
            <label className="block mb-1">Office Other expense</label>
            <input
              placeholder="Office Other Expense"
              type="number"
              {...register("officeOtherExpense")}
              className="p-2 rounded bg-gray-700 w-full"
            />
          </div>
          <div>
            <label className="block mb-1">Office Bank & Audit Changes</label>
            <input
              placeholder="Office Bank & Auditing Changes"
              type="number"
              {...register("officeBankAuditChanges")}
              className="p-2 rounded bg-gray-700 w-full"
            />
          </div> */}
          <div>
            <label className="block mb-1">Transfer (TO)</label>
            <input
              placeholder="Transfer (TO)"
              type="number"
              onWheel={(e) => e.target.blur()}
              {...register("to")}
              className="p-2 rounded bg-gray-700 w-full"
            />
          </div>

          <div>
            <label className="block mb-1">Disbursed Amount</label>
            <input
              type="text"
              readOnly
              value={
                watch("actualAmount")
                  ? `₹${parseFloat(watch("actualAmount")).toLocaleString(
                      "en-IN"
                    )}`
                  : ""
              }
              placeholder="Disbursed Amount"
              className="p-2 rounded bg-gray-700 w-full"
            />
          </div>
          <div>
            <label className="block mb-1">Total Payable</label>
            <input
              type="text"
              readOnly
              value={
                watch("totalPayable")
                  ? `₹${parseFloat(watch("totalPayable")).toLocaleString(
                      "en-IN"
                    )}`
                  : ""
              }
              placeholder="Total Payable"
              className="p-2 rounded bg-gray-700 w-full"
            />
          </div>

          <button
            type="submit"
            className="bg-teal-400 hover:bg-teal-500 text-black font-bold py-2 px-6 rounded-full md:col-span-2"
          >
            Submit Loan
          </button>
        </form>
        <Popup />
      </main>
    </div>
  );
};

export default CreateLoanPage;

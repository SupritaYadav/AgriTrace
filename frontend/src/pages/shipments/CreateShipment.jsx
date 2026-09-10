import { useState } from "react";
import {
  FaBox,
  FaLocationDot,
  FaTruck,
  FaTemperatureHalf,
  FaMicrochip,
} from "react-icons/fa6";

import { devices } from "../../data/mockData";

const initialForm = {
  productName: "",
  category: "Vegetables",
  batchId: "AGR-BATCH-010",
  quantity: "",
  unit: "kg",
  grade: "Grade A",

  organization: "",
  farmName: "",
  sourceCity: "",
  sourceDistrict: "",
  sourceState: "",
  pickupLocation: "",

  receiverOrganization: "",
  receiverName: "",
  destinationCity: "",
  destinationState: "",
  contactPerson: "",
  phone: "",

  departureDate: "",
  departureTime: "",
  deliveryDate: "",
  transportType: "Refrigerated Truck",
  vehicleNumber: "",
  driverName: "",

  temperatureMin: 8,
  temperatureMax: 28,
  humidityMin: 40,
  humidityMax: 80,
  gasThreshold: 50,

  deviceId: "",
};

function CreateShipment() {
  const [form, setForm] = useState(initialForm);
  const [message, setMessage] = useState("");

  const availableDevices = devices.filter(
    (device) => device.status === "Available"
  );

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  function handleSubmit(event) {
    event.preventDefault();

    console.log("Shipment:", form);

    setMessage(
      `Shipment for ${form.productName} created successfully.`
    );
  }

  function saveDraft() {
    localStorage.setItem(
      "agritrace-shipment-draft",
      JSON.stringify(form)
    );

    setMessage("Shipment draft saved locally.");
  }

  return (
    <div className="page-container">

      {message && (
        <div className="success-banner">
          {message}
        </div>
      )}

      <form
        className="form-shell"
        onSubmit={handleSubmit}
      >

        <FormSection
          icon={<FaBox />}
          title="Product Information"
        >
          <Input
            label="Product Name"
            name="productName"
            value={form.productName}
            onChange={handleChange}
            placeholder="Fresh Tomatoes"
            required
          />

          <Select
            label="Product Category"
            name="category"
            value={form.category}
            onChange={handleChange}
            options={[
              "Vegetables",
              "Fruits",
              "Grains",
              "Dairy",
              "Spices",
              "Other",
            ]}
          />

          <Input
            label="Batch ID"
            name="batchId"
            value={form.batchId}
            onChange={handleChange}
            readOnly
          />

          <Input
            label="Quantity"
            name="quantity"
            value={form.quantity}
            onChange={handleChange}
            type="number"
            placeholder="500"
          />

          <Select
            label="Unit"
            name="unit"
            value={form.unit}
            onChange={handleChange}
            options={[
              "kg",
              "quintal",
              "tonnes",
              "crates",
            ]}
          />

          <Select
            label="Quality Grade"
            name="grade"
            value={form.grade}
            onChange={handleChange}
            options={[
              "Grade A",
              "Grade B",
              "Grade C",
            ]}
          />
        </FormSection>

        <FormSection
          icon={<FaLocationDot />}
          title="Origin Details"
        >
          <Select
  label="Farmer / Organization"
  name="organization"
  value={form.organization}
  onChange={handleChange}
  options={[
    "",
    "ABC Organic Farm",
    "Sunrise Growers Collective",
    "Ganga Valley Farms",
  ]}
/>

          <Input
            label="Farm Name"
            name="farmName"
            value={form.farmName}
            onChange={handleChange}
          />

          <Input
            label="Village / City"
            name="sourceCity"
            value={form.sourceCity}
            onChange={handleChange}
          />

          <Input
            label="District"
            name="sourceDistrict"
            value={form.sourceDistrict}
            onChange={handleChange}
          />

          <Input
            label="State"
            name="sourceState"
            value={form.sourceState}
            onChange={handleChange}
          />

          <Input
            label="Pickup Location"
            name="pickupLocation"
            value={form.pickupLocation}
            onChange={handleChange}
          />
        </FormSection>

        <FormSection
          icon={<FaLocationDot />}
          title="Destination Details"
        >
          <Input
            label="Receiver Organization"
            name="receiverOrganization"
            value={form.receiverOrganization}
            onChange={handleChange}
          />

          <Input
            label="Warehouse / Retailer"
            name="receiverName"
            value={form.receiverName}
            onChange={handleChange}
          />

          <Input
            label="Destination City"
            name="destinationCity"
            value={form.destinationCity}
            onChange={handleChange}
          />

          <Input
            label="State"
            name="destinationState"
            value={form.destinationState}
            onChange={handleChange}
          />

          <Input
            label="Contact Person"
            name="contactPerson"
            value={form.contactPerson}
            onChange={handleChange}
          />

          <Input
            label="Phone"
            name="phone"
            value={form.phone}
            onChange={handleChange}
          />
        </FormSection>

        <FormSection
          icon={<FaTruck />}
          title="Shipment Information"
        >
          <Input
            label="Departure Date"
            type="date"
            name="departureDate"
            value={form.departureDate}
            onChange={handleChange}
          />

          <Input
            label="Departure Time"
            type="time"
            name="departureTime"
            value={form.departureTime}
            onChange={handleChange}
          />

          <Input
  label="Expected Delivery Date"
  type="date"
  name="deliveryDate"
  value={form.deliveryDate}
  onChange={handleChange}
/>

          <Select
            label="Transport Type"
            name="transportType"
            value={form.transportType}
            onChange={handleChange}
            options={[
              "Refrigerated Truck",
              "Open Truck",
              "Van",
              "Rail",
            ]}
          />

          <Input
            label="Vehicle Number"
            name="vehicleNumber"
            value={form.vehicleNumber}
            onChange={handleChange}
          />

          <Input
            label="Driver Name"
            name="driverName"
            value={form.driverName}
            onChange={handleChange}
          />
        </FormSection>

        <FormSection
          icon={<FaTemperatureHalf />}
          title="Environmental Thresholds"
        >
          <Input
            label="Temperature Min °C"
            type="number"
            name="temperatureMin"
            value={form.temperatureMin}
            onChange={handleChange}
          />

          <Input
            label="Temperature Max °C"
            type="number"
            name="temperatureMax"
            value={form.temperatureMax}
            onChange={handleChange}
          />

          <Input
            label="Humidity Min %"
            type="number"
            name="humidityMin"
            value={form.humidityMin}
            onChange={handleChange}
          />

          <Input
            label="Humidity Max %"
            type="number"
            name="humidityMax"
            value={form.humidityMax}
            onChange={handleChange}
          />

          <Input
            label="Gas Threshold"
            type="number"
            name="gasThreshold"
            value={form.gasThreshold}
            onChange={handleChange}
          />
        </FormSection>

        <FormSection
          icon={<FaMicrochip />}
          title="Assign IoT Device"
        >

          <Select
            label="Available Device"
            name="deviceId"
            value={form.deviceId}
            onChange={handleChange}
            options={[
              "",
              ...availableDevices.map(
                (device) => device.id
              ),
            ]}
          />

        </FormSection>

        <div className="form-actions">

          <button
            type="button"
            className="btn secondary"
            onClick={saveDraft}
          >
            Save Draft
          </button>

          <button
            className="btn primary"
            type="submit"
          >
            Create Shipment
          </button>

        </div>

      </form>

    </div>
  );
}

function FormSection({ icon, title, children }) {
  return (
    <section className="card form-section">
      <div className="section-head">
        <span>{icon}</span>
        <h3>{title}</h3>
      </div>

      <div className="form-grid">
        {children}
      </div>
    </section>
  );
}

function Input({
  label,
  name,
  value,
  onChange,
  type = "text",
  ...props
}) {
  return (
    <div className="field">
      <label>{label}</label>
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        {...props}
      />
    </div>
  );
}

function Select({
  label,
  name,
  value,
  onChange,
  options,
}) {
  return (
    <div className="field">
      <label>{label}</label>
      <select
        name={name}
        value={value}
        onChange={onChange}
      >
        {options.map((option) => (
          <option
            value={option}
            key={option || "none"}
          >
            {option || "Select organization"}
          </option>
        ))}
      </select>
    </div>
  );
}

export default CreateShipment;
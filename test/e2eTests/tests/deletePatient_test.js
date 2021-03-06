const assert = require('assert');

// Test for:
// https://docs.google.com/document/d/1tav6VO5tl2ghL-owOgKSV4B-w3LhGZo4NyUCAbBxhIE/edit#

Feature('Delete Patient');

const LOG_TAG = '[DeletePatientTests]';

let Patient = null;

Before(async (I, Apis, Data) => {
  I.say(`${LOG_TAG} Creating patient to be deleted`);
  Patient = await Apis.patient.create(Data.patients.patient2);
});

// TODO: Centralize this to be reused
After(async (I, Apis, Data) => {
  // Removes the visit if it was created
  const cleanUpPatientVisit = async (patient) => {
    I.say(`${LOG_TAG} Deleting any visits created through the UI`);

    I.say(`${LOG_TAG} Getting all visits associated with patient ${patient.uuid}`);
    const visits = await Apis.visit.getAll({ patient: patient.uuid });

    I.say(`${LOG_TAG} Deleting ${visits.length} visits associated with patient ${patient.uuid}`);
    if (visits.length) {
      visits.forEach(async v => await Apis.visit.delete(v));
    }
  };

  // Removes the encounter if it was created
  const cleanUpPatientEncounter = async (patient) => {
    I.say(`${LOG_TAG} Deleting any encounters created through the UI`);

    I.say(`${LOG_TAG} Getting all encounters associated with patient ${patient.uuid}`);
    const encounters = await Apis.encounter.getAll({ patient: patient.uuid });

    I.say(`${LOG_TAG} Deleting ${encounters.length} encounters associated with patient ${patient.uuid}`);
    if (encounters.length) {
      encounters.forEach(async v => await Apis.encounter.delete(v));
    }
  };

  await cleanUpPatientEncounter(Patient);
  await cleanUpPatientVisit(Patient);
});

Scenario('Successfully delete a patient', async (I, Apis, Data, RegistrationDashboardPage) => {
  const registrationPage = loginAndLoadPatientOnRegistrationDashboard(I, Data, RegistrationDashboardPage);

  RegistrationDashboardPage.clickDeletePatientButton();
  RegistrationDashboardPage.deletePatientModalIsLoaded();
  RegistrationDashboardPage.deletePatient('Testing patient deletion...');
  RegistrationDashboardPage.verifySuccessToast();

  I.say(`${LOG_TAG} Return to registration page`);
  registrationPage.isLoaded();

  I.say(`${LOG_TAG} Make sure the patient was actually deleted by searching by identifier`);
  registrationPage.search(Data.patients.patient2.identifiers[0].identifier);

  I.say(`${LOG_TAG} There should be no patient with that identifier`);
  registrationPage.dontSeePatientRecord(Data.patients.patient2);
  registrationPage.seeNoResults();
});

Scenario('Declare a patient without encounters as dead', async (I, Apis, Data, RegistrationDashboardPage) => {
  loginAndLoadPatientOnRegistrationDashboard(I, Data, RegistrationDashboardPage);

  RegistrationDashboardPage.clickDeletePatientButton();
  RegistrationDashboardPage.deletePatientModalIsLoaded();
  RegistrationDashboardPage.checkIsDeadBox();

  RegistrationDashboardPage.declarePatientAsDead(Data.deathData.details[0].reason, Data.deathData.details[0].date);
  RegistrationDashboardPage.verifySuccessToast();
  RegistrationDashboardPage.verifyPatientDeathDetails(Data.deathData.details[0]);
});

Scenario('Attempt to delete a patient with encounter, then declare dead', async (I, Apis, Data, ClinicDashboardPage) => {
  I.say(`${LOG_TAG} login`);
  let dashboardPage = I.login();

  I.say(`${LOG_TAG} Navigate to the clinical page`);
  const clinicPage = dashboardPage.navigateToClinicPage();

  I.say(`${LOG_TAG} Disable auto-select`);
  clinicPage.disableAutoSelect();

  I.say(`${LOG_TAG} Search for patient's identifier`);
  clinicPage.searchForPatientByIdAndSelect(Data.patients.patient2);

  I.say(`${LOG_TAG} Make sure the clinic dashboard page is loaded`);
  ClinicDashboardPage.isLoaded();

  I.say(`${LOG_TAG} Select the consultation tab`);
  ClinicDashboardPage.clickConsultationTab();

  I.say(`${LOG_TAG} Click the add vitals button`);
  const vitalsAdultFormPage = ClinicDashboardPage.clickAddVitals();

  I.say(`${LOG_TAG} Fill in the vitals form`);
  vitalsAdultFormPage.fillForm(Data.clinicalData.vitals[0]);

  I.say(`${LOG_TAG} Click the next button`);
  vitalsAdultFormPage.clickNext();

  I.say(`${LOG_TAG} Click the confirm button`);
  const clinicDashboardPage = vitalsAdultFormPage.clickConfirm();

  clinicDashboardPage.clickTransferPatientButton();
  const registrationDashboardPage = clinicDashboardPage.transferToRegistrationModule();

  registrationDashboardPage.clickDeletePatientButton();
  registrationDashboardPage.deletePatientModalIsLoaded();
  registrationDashboardPage.verifyRestrictionToDeletePatient();

  registrationDashboardPage.declarePatientAsDead(Data.deathData.details[1].reason, Data.deathData.details[1].date);
  registrationDashboardPage.verifySuccessToast();
  registrationDashboardPage.verifyPatientDeathDetails(Data.deathData.details[1]);
});

const loginAndLoadPatientOnRegistrationDashboard = (I, Data, RegistrationDashboardPage) => {
  I.say(`${LOG_TAG} login`);
  let dashboardPage = I.login();

  I.say(`${LOG_TAG} Navigate to the registration page`);
  const registrationPage = dashboardPage.navigateToRegistrationPage();

  I.say(`${LOG_TAG} Disable auto-select`);
  registrationPage.disableAutoSelect();

  I.say(`${LOG_TAG} Search for patient's identifier`);
  registrationPage.searchForPatientByIdAndSelect(Data.patients.patient2);

  I.say(`${LOG_TAG} Make sure the registration dashboard page is loaded`);
  RegistrationDashboardPage.isLoaded();

  return registrationPage;
};

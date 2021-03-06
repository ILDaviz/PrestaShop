/**
 * Copyright since 2007 PrestaShop SA and Contributors
 * PrestaShop is an International Registered Trademark & Property of PrestaShop SA
 *
 * NOTICE OF LICENSE
 *
 * This source file is subject to the Open Software License (OSL 3.0)
 * that is bundled with this package in the file LICENSE.md.
 * It is also available through the world-wide-web at this URL:
 * https://opensource.org/licenses/OSL-3.0
 * If you did not receive a copy of the license and are unable to
 * obtain it through the world-wide-web, please send an email
 * to license@prestashop.com so we can send you a copy immediately.
 *
 * DISCLAIMER
 *
 * Do not edit or add to this file if you wish to upgrade PrestaShop to newer
 * versions in the future. If you wish to customize PrestaShop for your
 * needs please refer to https://devdocs.prestashop.com/ for more information.
 *
 * @author    PrestaShop SA and Contributors <contact@prestashop.com>
 * @copyright Since 2007 PrestaShop SA and Contributors
 * @license   https://opensource.org/licenses/OSL-3.0 Open Software License (OSL 3.0)
 */
require('module-alias/register');
// Using chai
const {expect} = require('chai');

// Import utils
const helper = require('@utils/helpers');
const loginCommon = require('@commonTests/loginBO');

// Import pages
const LoginPage = require('@pages/BO/login');
const DashboardPage = require('@pages/BO/dashboard');
const ProductSettingsPage = require('@pages/BO/shopParameters/productSettings');
const CartRulesPage = require('@pages/BO/catalog/discounts');
const CatalogPriceRulesPage = require('@pages/BO/catalog/discounts/catalogPriceRules');
const AddCatalogPriceRulePage = require('@pages/BO/catalog/discounts/catalogPriceRules/add');
const ProductPage = require('@pages/FO/product');
const HomePage = require('@pages/FO/home');

// Import data
const PriceRuleFaker = require('@data/faker/catalogPriceRule');

// import test context
const testContext = require('@utils/testContext');

const baseContext = 'functional_BO_shopParameters_productSettings_displayDiscountedPrice';

let browserContext;
let page;

const priceRuleData = new PriceRuleFaker(
  {
    currency: 'All currencies',
    country: 'All countries',
    group: 'All groups',
    reductionType: 'Amount',
    reductionTax: 'Tax included',
    fromQuantity: 3,
    reduction: 20,
  },
);
// Unit discount in Volume discounts table(Product page FO)
const unitDiscountToCheck = '€20.00';
// Unit price in Volume discounts table(Product page FO)
const unitPriceToCheck = '€8.68';

// Init objects needed
const init = async function () {
  return {
    loginPage: new LoginPage(page),
    dashboardPage: new DashboardPage(page),
    productSettingsPage: new ProductSettingsPage(page),
    cartRulesPage: new CartRulesPage(page),
    catalogPriceRulesPage: new CatalogPriceRulesPage(page),
    addCatalogPriceRulePage: new AddCatalogPriceRulePage(page),
    homePage: new HomePage(page),
    productPage: new ProductPage(page),
  };
};

describe('Enable/Disable display discounted price', async () => {
  // before and after functions
  before(async function () {
    browserContext = await helper.createBrowserContext(this.browser);
    page = await helper.newTab(browserContext);

    this.pageObjects = await init();
  });

  after(async () => {
    await helper.closeBrowserContext(browserContext);
  });

  // Login into BO and go to products page
  loginCommon.loginBO();

  it('should go to \'Catalog > Discounts\' page', async function () {
    await testContext.addContextItem(this, 'testIdentifier', 'goToDiscountsPage', baseContext);

    await this.pageObjects.dashboardPage.goToSubMenu(
      this.pageObjects.dashboardPage.catalogParentLink,
      this.pageObjects.dashboardPage.discountsLink,
    );

    const pageTitle = await this.pageObjects.cartRulesPage.getPageTitle();
    await expect(pageTitle).to.contains(this.pageObjects.cartRulesPage.pageTitle);
  });

  it('should go to \'Catalog Price Rules\' tab', async function () {
    await testContext.addContextItem(this, 'testIdentifier', 'goToCatalogPriceRulesTab', baseContext);

    await this.pageObjects.cartRulesPage.goToCatalogPriceRulesTab();
    const pageTitle = await this.pageObjects.catalogPriceRulesPage.getPageTitle();
    await expect(pageTitle).to.contains(this.pageObjects.catalogPriceRulesPage.pageTitle);
  });

  it('should create new catalog price rule', async function () {
    await testContext.addContextItem(this, 'testIdentifier', 'createCatalogPriceRule', baseContext);

    await this.pageObjects.catalogPriceRulesPage.goToAddNewCatalogPriceRulePage();
    const pageTitle = await this.pageObjects.addCatalogPriceRulePage.getPageTitle();
    await expect(pageTitle).to.contains(this.pageObjects.addCatalogPriceRulePage.pageTitle);

    const validationMessage = await this.pageObjects.addCatalogPriceRulePage.createEditCatalogPriceRule(priceRuleData);
    await expect(validationMessage).to.contains(this.pageObjects.catalogPriceRulesPage.successfulCreationMessage);
  });

  it('should go to \'Shop parameters > Product Settings\' page', async function () {
    await testContext.addContextItem(this, 'testIdentifier', 'goToProductSettingsPage', baseContext);

    await this.pageObjects.addCatalogPriceRulePage.goToSubMenu(
      this.pageObjects.addCatalogPriceRulePage.shopParametersParentLink,
      this.pageObjects.addCatalogPriceRulePage.productSettingsLink,
    );

    await this.pageObjects.productSettingsPage.closeSfToolBar();

    const pageTitle = await this.pageObjects.productSettingsPage.getPageTitle();
    await expect(pageTitle).to.contains(this.pageObjects.productSettingsPage.pageTitle);
  });

  const tests = [
    {
      args: {
        action: 'disable', enable: false, textColumnToCheck: 'Unit discount', valueToCheck: unitDiscountToCheck,
      },
    },
    {
      args: {
        action: 'enable', enable: true, textColumnToCheck: 'Unit price', valueToCheck: unitPriceToCheck,
      },
    },
  ];

  tests.forEach((test, index) => {
    it(`should ${test.args.action} display discounted price`, async function () {
      await testContext.addContextItem(
        this,
        'testIdentifier',
        `${test.args.action}DisplayDiscountedPrice`,
        baseContext,
      );

      const result = await this.pageObjects.productSettingsPage.setDisplayDiscountedPriceStatus(
        test.args.enable,
      );

      await expect(result).to.contains(this.pageObjects.productSettingsPage.successfulUpdateMessage);
    });

    it('should check the existence of the unit value', async function () {
      await testContext.addContextItem(
        this,
        'testIdentifier',
        `checkUnitValue${this.pageObjects.productSettingsPage.uppercaseFirstCharacter(test.args.action)}`,
        baseContext,
      );

      page = await this.pageObjects.productSettingsPage.viewMyShop();
      this.pageObjects = await init();

      await this.pageObjects.homePage.changeLanguage('en');
      await this.pageObjects.homePage.goToProductPage(1);

      const columnTitle = await this.pageObjects.productPage.getDiscountColumnTitle();
      await expect(columnTitle).to.equal(test.args.textColumnToCheck);

      const columnValue = await this.pageObjects.productPage.getDiscountValue();
      await expect(columnValue).to.equal(test.args.valueToCheck);
    });

    it('should go back to BO', async function () {
      await testContext.addContextItem(this, 'testIdentifier', `goBackToBo${index}`, baseContext);

      page = await this.pageObjects.productPage.closePage(browserContext, 0);
      this.pageObjects = await init();

      const pageTitle = await this.pageObjects.productSettingsPage.getPageTitle();
      await expect(pageTitle).to.contains(this.pageObjects.productSettingsPage.pageTitle);
    });
  });

  it('should go to \'Catalog > Discounts\' page', async function () {
    await testContext.addContextItem(this, 'testIdentifier', 'goToDiscountsPageToDeletePriceRule', baseContext);

    await this.pageObjects.productSettingsPage.goToSubMenu(
      this.pageObjects.productSettingsPage.catalogParentLink,
      this.pageObjects.productSettingsPage.discountsLink,
    );

    const pageTitle = await this.pageObjects.cartRulesPage.getPageTitle();
    await expect(pageTitle).to.contains(this.pageObjects.cartRulesPage.pageTitle);
  });

  it('should go to \'Catalog Price Rules\' tab', async function () {
    await testContext.addContextItem(this, 'testIdentifier', 'goToCatalogPriceRuleTabToDeletePriceRule', baseContext);

    await this.pageObjects.cartRulesPage.goToCatalogPriceRulesTab();
    const pageTitle = await this.pageObjects.catalogPriceRulesPage.getPageTitle();
    await expect(pageTitle).to.contains(this.pageObjects.catalogPriceRulesPage.pageTitle);
  });

  it('should delete catalog price rule', async function () {
    await testContext.addContextItem(this, 'testIdentifier', 'deleteCatalogPriceRule', baseContext);

    const deleteTextResult = await this.pageObjects.catalogPriceRulesPage.deleteCatalogPriceRule(priceRuleData.name);
    await expect(deleteTextResult).to.contains(this.pageObjects.catalogPriceRulesPage.successfulDeleteMessage);
  });
});

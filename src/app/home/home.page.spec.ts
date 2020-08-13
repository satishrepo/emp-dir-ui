import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { HomePage } from './home.page';
import { HomeMockService } from '../shared/services/home.mock.service';
import { HomeService } from '../shared/services/home.service';
import { MenuController, PopoverController, ModalController, AngularDelegate } from '@ionic/angular';

fdescribe('HomePage', () => {
  let component: HomePage;
  let fixture: ComponentFixture<HomePage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ HomePage ],
      imports: [RouterTestingModule.withRoutes([])],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
      providers : [
        { provide : HomeService, useClass : HomeMockService }, MenuController, PopoverController, ModalController, AngularDelegate,
      ]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(HomePage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should generate list ', () => {
    component.loadContacts();
    fixture.detectChanges();
    expect(component.contactList.length).toEqual(1);
  });
});

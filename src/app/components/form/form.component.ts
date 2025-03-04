import { NgIf } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormGroup, FormBuilder, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-form',
  standalone: true,
  imports: [ReactiveFormsModule, NgIf],
  templateUrl: './form.component.html',
  styleUrls: ['./form.component.scss'],
})
export class FormComponent implements OnInit {
  form: FormGroup;
  cacheName = 'form-data-cache';
  showModal = false;

  constructor(private fb: FormBuilder) {
    this.form = this.fb.group({
      name: [''],
      selectOption: ['option1'],
      agree: [false],
    });
  }

  ngOnInit() {
    this.checkForCachedData();
    this.form.valueChanges.subscribe((value) => {
      console.log('Form value changed:', value);
      this.saveData(value);
    });
  }

  checkForCachedData() {
    if ('serviceWorker' in navigator) {
      caches.open(this.cacheName).then((cache) => {
        cache.match('formData').then((response) => {
          if (response) {
            response.json().then((data) => {
              if (Object.keys(data).length > 0) {
                this.showModal = true;
              }
            });
          }
        });
      });
    }
  }

  loadCachedData() {
    if (navigator.serviceWorker) {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        registrations.forEach((registration) => {
          const messageChannel = new MessageChannel();
          messageChannel.port1.onmessage = (event) => {
            if (event.data && event.data.type === 'FORM_DATA') {
              console.log('Loaded data from cache:', event.data.payload);
              this.form.patchValue(event.data.payload);
            }
            this.showModal = false;
          };
          console.log('Sending GET_FORM_DATA message to Service Worker...');
          registration.active?.postMessage(
            {
              type: 'GET_FORM_DATA',
            },
            [messageChannel.port2]
          );
        });
      });
    }
  }

  clearCache() {
    if (navigator.serviceWorker) {
      caches.open(this.cacheName).then((cache) => {
        cache.delete('formData').then(() => {
          console.log('Cache cleared.');
          this.showModal = false;
        });
      });
    }
  }

  saveData(value: any) {
    console.log('Attempting to save data:', value);
    if (navigator.serviceWorker) {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        registrations.forEach((registration) => {
          if (registration.active) {
            console.log('Sending SAVE_FORM_DATA message to Service Worker...');
            registration.active.postMessage({
              type: 'SAVE_FORM_DATA',
              payload: value,
            });
          } else {
            console.log('No active Service Worker registration found.');
          }
        });
      });
    }
  }

  checkCache() {
    console.log('Checking cache...');
    caches
      .open(this.cacheName)
      .then((cache) => {
        cache
          .match('formData')
          .then((response) => {
            if (response) {
              this.showModal = true;
              response.json().then((data) => {
                console.log('Cached data:', data);
              });
            } else {
              console.log('No cached data found.');
            }
          })
          .catch((err) => {
            console.error('Error checking cache:', err);
          });
      })
      .catch((err) => {
        console.error('Error opening cache:', err);
      });
  }
}

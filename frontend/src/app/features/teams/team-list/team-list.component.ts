import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { AvatarModule } from 'primeng/avatar';
import { AvatarGroupModule } from 'primeng/avatargroup';
import { Team, TeamService } from '../../../core/team.service';

import { TooltipModule } from 'primeng/tooltip';

@Component({
  selector: 'app-team-list',
  standalone: true,
  imports: [CommonModule, RouterLink, TableModule, ButtonModule, AvatarModule, AvatarGroupModule, TooltipModule],
  templateUrl: './team-list.component.html'
})
export class TeamListComponent implements OnInit {
  teams = signal<Team[]>([]);
  showInactive = signal(false);

  constructor(private teamService: TeamService) { }

  ngOnInit() {
    this.loadTeams();
  }

  loadTeams() {
    this.teamService.getTeams(this.showInactive()).subscribe(teams => {
      this.teams.set(teams);
    });
  }

  toggleInactive() {
    this.showInactive.update(v => !v);
    this.loadTeams();
  }
}

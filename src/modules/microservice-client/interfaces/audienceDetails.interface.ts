import { AudienceType, GenerationGroup } from 'src/common/constants';
import { BaseInterface } from 'src/common/interface';

export interface IAudienceDetails {
	name: GenerationGroup;
	audienceDescription: string;
	isActive?: boolean;
	isDeleted?: boolean;
	type: AudienceType;
}
